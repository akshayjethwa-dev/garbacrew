import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import * as crypto from "crypto";

const db = getFirestore();

const PLATFORM_FEE_PERCENT = 5;
const TIER_PRICING: Record<string, number> = { free: 0, plus: 149, pro: 349 };
const BOOST_PRICING: Record<string, number> = {
  spotlight: 49,
  plan_highlight: 99,
  reputation_shield: 199,
};

// ─────────────────────────────────────────────────────────
// Story 8.1: 5% Platform Fee
// ─────────────────────────────────────────────────────────

/**
 * Fires when a Plan transitions to "completed".
 * Creates a Payout record with the 5% platform fee deducted.
 * Payout is released 24h after completion.
 */
export const onCreatePayoutForCompletedPlan = onDocumentUpdated(
  "plans/{planId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;
    if (before.status === after.status) return;
    if (after.status !== "completed") return;
    if (!after.costTotal || after.costTotal <= 0) return;

    const planId = event.params.planId;

    // Avoid double payouts
    const existingSnap = await db
      .collection("payouts")
      .where("planId", "==", planId)
      .limit(1)
      .get();
    if (!existingSnap.empty) {
      logger.info(`Payout already exists for plan ${planId}`);
      return;
    }

    const grossAmount = after.costTotal;
    const platformFee = Math.round((grossAmount * PLATFORM_FEE_PERCENT) / 100);
    const netAmount = grossAmount - platformFee;

    const releaseAt = Timestamp.fromDate(
      new Date(Date.now() + 24 * 60 * 60 * 1000)
    );

    await db.collection("payouts").add({
      hostUid: after.hostUid,
      planId,
      planTitle: after.title,
      grossAmount,
      platformFee,
      netAmount,
      status: "pending",
      razorpayPaymentId: null,
      razorpayTransferId: null,
      retryCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      releaseAt,
    });

    logger.info(`Payout created for plan ${planId}: ₹${netAmount} net`);
  }
);

/**
 * Scheduled job: process payouts whose 24h hold period has passed.
 * In production, this calls Razorpay's Transfer API.
 */
export const processPendingPayouts = onSchedule(
  {
    schedule: "every 60 minutes",
    timeZone: "Asia/Kolkata",
    region: "asia-south1",
  },
  async () => {
    const now = Timestamp.now();
    const snap = await db
      .collection("payouts")
      .where("status", "==", "pending")
      .where("releaseAt", "<=", now)
      .limit(50)
      .get();

    if (snap.empty) {
      logger.info("No payouts to process");
      return;
    }

    for (const docSnap of snap.docs) {
      const payout = docSnap.data();
      try {
        // TODO: Call Razorpay Transfer API here
        // const transfer = await razorpay.transfers.create({
        //   account: await getHostRazorpayAccount(payout.hostUid),
        //   amount: payout.netAmount * 100, // paise
        //   currency: "INR",
        //   notes: { planId: payout.planId },
        // });

        // For now, just mark as paid (staging behavior)
        await docSnap.ref.update({
          status: "paid",
          releasedAt: FieldValue.serverTimestamp(),
          razorpayTransferId: `mock_transfer_${docSnap.id}`,
        });
        logger.info(`Payout ${docSnap.id} released`);
      } catch (error: any) {
        const retryCount = (payout.retryCount ?? 0) + 1;
        const backoffMinutes = Math.min(60 * 24, Math.pow(2, retryCount));
        await docSnap.ref.update({
          status: retryCount >= 7 ? "failed" : "pending",
          retryCount,
          failureReason: error.message ?? "Unknown",
          nextRetryAt: Timestamp.fromDate(
            new Date(Date.now() + backoffMinutes * 60 * 1000)
          ),
        });
        logger.error(
          `Payout ${docSnap.id} failed (attempt ${retryCount})`,
          error
        );
      }
    }
  }
);

// ─────────────────────────────────────────────────────────
// Story 8.2: Subscriptions
// ─────────────────────────────────────────────────────────

/**
 * Callable: creates a Razorpay subscription checkout session.
 * Returns a short URL the app opens in a WebView.
 */
export const createSubscriptionCheckout = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in");
  }
  const uid = request.auth.uid;
  const { tier } = request.data as { tier: "plus" | "pro" };

  // tier is already constrained to "plus" | "pro" by the type assertion above.
  // Validate against the pricing table in case a malicious client sends garbage.
  if (!TIER_PRICING[tier]) {
    throw new HttpsError("invalid-argument", "Invalid tier");
  }

  // In production: create Razorpay subscription via razorpay.subscriptions.create
  // For now, return a mock shortUrl. The app will open a WebView.
  const mockSubscriptionId = `sub_${uid}_${Date.now()}`;
  const mockShortUrl = `https://rzp.io/mock/${mockSubscriptionId}`;

  await db
    .collection("subscriptions")
    .doc(uid)
    .set(
      {
        uid,
        tier,
        status: "past_due", // will flip to active after webhook confirms
        razorpaySubscriptionId: mockSubscriptionId,
        razorpayCustomerId: null,
        currentPeriodStart: Timestamp.now(),
        currentPeriodEnd: Timestamp.fromDate(
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        ),
        cancelAtPeriodEnd: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

  return {
    subscriptionId: mockSubscriptionId,
    shortUrl: mockShortUrl,
    keyId: process.env.RAZORPAY_KEY_ID ?? "rzp_test_mock",
  };
});

/**
 * Callable: cancels the current subscription at period end.
 */
export const cancelSubscription = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in");
  }
  const uid = request.auth.uid;

  const subRef = db.collection("subscriptions").doc(uid);
  const snap = await subRef.get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "No subscription found");
  }

  await subRef.update({
    cancelAtPeriodEnd: true,
    cancelledAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // TODO: call razorpay.subscriptions.cancel
});

/**
 * Scheduled: downgrades subscriptions that have passed currentPeriodEnd.
 * Also handles the 3-day grace period.
 */
export const processExpiredSubscriptions = onSchedule(
  {
    schedule: "every day 02:00",
    timeZone: "Asia/Kolkata",
    region: "asia-south1",
  },
  async () => {
    const now = Timestamp.now();

    // Step 1: mark active subs past period end as grace_period
    const activeSnap = await db
      .collection("subscriptions")
      .where("status", "==", "active")
      .where("currentPeriodEnd", "<=", now)
      .get();

    for (const d of activeSnap.docs) {
      const sub = d.data();
      if (sub.cancelAtPeriodEnd) {
        // Cancel outright (no grace if user requested it)
        await d.ref.update({
          tier: "free",
          status: "expired",
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        // Grace period of 3 days
        await d.ref.update({
          status: "grace_period",
          gracePeriodEndsAt: Timestamp.fromDate(
            new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          ),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }

    // Step 2: expire grace periods that have ended
    const graceSnap = await db
      .collection("subscriptions")
      .where("status", "==", "grace_period")
      .where("gracePeriodEndsAt", "<=", now)
      .get();

    for (const d of graceSnap.docs) {
      await d.ref.update({
        tier: "free",
        status: "expired",
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    logger.info(
      `Processed ${activeSnap.size} expirations and ${graceSnap.size} grace endings`
    );
  }
);

// ─────────────────────────────────────────────────────────
// Story 8.3: Boosts
// ─────────────────────────────────────────────────────────

/**
 * Callable: creates a Razorpay order for a boost purchase.
 */
export const createBoostCheckout = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in");
  }
  const uid = request.auth.uid;
  const { type, targetId } = request.data as {
    type: "spotlight" | "plan_highlight" | "reputation_shield";
    targetId: string | null;
  };

  const amount = BOOST_PRICING[type];
  if (!amount) {
    throw new HttpsError("invalid-argument", "Unknown boost type");
  }

  // In production: razorpay.orders.create
  const mockOrderId = `order_${uid}_${Date.now()}`;

  await db.collection("pendingBoostOrders").doc(mockOrderId).set({
    uid,
    type,
    targetId,
    amount,
    createdAt: FieldValue.serverTimestamp(),
  });

  return {
    orderId: mockOrderId,
    amount,
    currency: "INR",
    keyId: process.env.RAZORPAY_KEY_ID ?? "rzp_test_mock",
  };
});

/**
 * Callable: called by the app after Razorpay reports payment success.
 * Verifies the signature and writes the Boost doc.
 */
export const confirmBoostPayment = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in");
  }
  const uid = request.auth.uid;
  const { orderId, paymentId, signature } = request.data as {
    orderId: string;
    paymentId: string;
    signature: string;
  };

  const orderRef = db.collection("pendingBoostOrders").doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) {
    throw new HttpsError("not-found", "Order not found");
  }
  const order = orderSnap.data()!;
  if (order.uid !== uid) {
    throw new HttpsError("permission-denied", "Not your order");
  }

  // Verify signature (skip if using mock in dev)
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (secret) {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
    if (expected !== signature) {
      throw new HttpsError("invalid-argument", "Invalid signature");
    }
  }

  const expiresAt = Timestamp.fromDate(
    new Date(Date.now() + 24 * 60 * 60 * 1000)
  );

  await db.collection("boosts").add({
    uid,
    type: order.type,
    pricePaid: order.amount,
    razorpayPaymentId: paymentId,
    targetId: order.targetId,
    expiresAt,
    used: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  await orderRef.delete();

  logger.info(`Boost purchased: ${order.type} by ${uid}`);
});