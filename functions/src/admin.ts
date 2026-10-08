import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

const db = getFirestore();

/**
 * Reads ADMIN_EMAILS from functions/.env (comma-separated).
 * Example: ADMIN_EMAILS=you@example.com,partner@example.com
 */
function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Throws if the caller isn't an authorized admin.
 * Also checks the adminUids collection as a fallback.
 */
async function requireAdmin(
  request: CallableRequest
): Promise<{ uid: string; email: string }> {
  if (!request.auth) {
    logger.warn("adminAuth: no auth on request");
    throw new HttpsError("unauthenticated", "Must be signed in");
  }

  const email = (request.auth.token.email ?? "").toLowerCase();
  const uid = request.auth.uid;

  if (!email) {
    throw new HttpsError(
      "permission-denied",
      "Your account has no email on file. Sign in with email/password."
    );
  }

  // 1. Primary check: email whitelist from env
  if (getAdminEmails().includes(email)) {
    return { uid, email };
  }

  // 2. Fallback: check the adminUids collection
  const adminDoc = await db.collection("adminUids").doc(uid).get();
  if (adminDoc.exists) {
    return { uid, email };
  }

  logger.warn("adminAuth: email not whitelisted", {
    uid,
    email,
    allowedEmails: getAdminEmails(),
  });

  throw new HttpsError(
    "permission-denied",
    `Email ${email} is not on the admin whitelist.`
  );
}

// Shared config for ALL admin callables
const CALLABLE_OPTS = { invoker: "public" as const };

// ─────────────────────────────────────────────────────────
// Collections the admin panel is allowed to query.
// Add to this set whenever you add a new admin page.
// ─────────────────────────────────────────────────────────
const ADMIN_MANAGED_COLLECTIONS = new Set([
  // ── Epic 7: Trust & Safety ──
  "reports",
  "disputes",
  "strikes",
  "safetyAlerts",
  "sosEvents",
  "blocks",

  // ── Epic 8: Monetization ──
  "payouts",
  "boosts",
  "subscriptions",
  "pendingBoostOrders",
  "partnerships",
  "partnershipInvoices",
  "vendors",

  // ── Epic 3 + 4: Plan + Squad ──
  "plans",
  "squads",
  "chats",

  // ── Epic 1 + 2: Users ──
  "users",
  "adminUids",

  // ── Admin-managed content ──
  "photographers",
  "events",
  "appConfig",

  // ── Activity / audit ──
  "activityFeed",
  "scoreEvents",
  "escrow",
  "ratings",
]);

// ─────────────────────────────────────────────────────────
// Diagnostic — always public, doesn't require admin
// ─────────────────────────────────────────────────────────
export const adminWhoami = onCall(CALLABLE_OPTS, async (request) => {
  return {
    authenticated: !!request.auth,
    uid: request.auth?.uid ?? null,
    email: request.auth?.token.email ?? null,
    emailVerified: request.auth?.token.email_verified ?? false,
    provider: request.auth?.token.firebase?.sign_in_provider ?? null,
    allowedEmails: getAdminEmails(),
    serverTime: new Date().toISOString(),
  };
});

// ─────────────────────────────────────────────────────────
// Story 9.1: Verification
// ─────────────────────────────────────────────────────────
export const adminVerify = onCall(CALLABLE_OPTS, async (request) => {
  const { email } = await requireAdmin(request);
  return { ok: true, email };
});

// ─────────────────────────────────────────────────────────
// Story 9.5: Dashboard stats
// ─────────────────────────────────────────────────────────
export const adminDashboard = onCall(CALLABLE_OPTS, async (request) => {
  await requireAdmin(request);

  const [
    usersCount,
    plansCount,
    squadsCount,
    reportsOpenCount,
    disputesOpenCount,
    vendorsPendingCount,
    payoutsSnap,
  ] = await Promise.all([
    db.collection("users").count().get(),
    db.collection("plans").count().get(),
    db.collection("squads").count().get(),
    db.collection("reports").where("status", "==", "open").count().get(),
    db.collection("disputes").where("outcome", "==", "pending").count().get(),
    db.collection("vendors").where("status", "==", "pending").count().get(),
    db.collection("payouts").where("status", "==", "paid").get(),
  ]);

  const totalRevenue = payoutsSnap.docs.reduce(
    (sum, d) => sum + (d.data().platformFee ?? 0),
    0
  );

  const weekAgo = Timestamp.fromDate(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  const newUsersSnap = await db
    .collection("users")
    .where("createdAt", ">=", weekAgo)
    .get();

  let recentActivity: any[] = [];
  try {
    const snap = await db
      .collection("activityFeed")
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();
    recentActivity = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toMillis?.() ?? null,
    }));
  } catch {
    recentActivity = [];
  }

  return {
    users: usersCount.data().count,
    plans: plansCount.data().count,
    squads: squadsCount.data().count,
    reportsOpen: reportsOpenCount.data().count,
    disputesOpen: disputesOpenCount.data().count,
    vendorsPending: vendorsPendingCount.data().count,
    totalRevenue,
    newUsersThisWeek: newUsersSnap.size,
    recentActivity,
  };
});

// ─────────────────────────────────────────────────────────
// Generic CRUD
// ─────────────────────────────────────────────────────────
export const adminList = onCall(CALLABLE_OPTS, async (request) => {
  await requireAdmin(request);
  const { collection: coll, limit: lim = 50, cursor, filters, orderByField, orderDir } = request.data as {
    collection: string;
    limit?: number;
    cursor?: string | null;
    filters?: Record<string, any>;
    orderByField?: string;
    orderDir?: "asc" | "desc";
  };

  if (!ADMIN_MANAGED_COLLECTIONS.has(coll)) {
    logger.warn(`adminList: collection not allowed: ${coll}`);
    throw new HttpsError(
      "invalid-argument",
      `Collection "${coll}" not allowed. Allowed: ${Array.from(
        ADMIN_MANAGED_COLLECTIONS
      ).join(", ")}`
    );
  }

  // Default sort: createdAt desc. Some collections don't have createdAt,
  // so the caller can pass `orderByField` to override.
  const sortField = orderByField ?? "createdAt";
  const sortDir = orderDir ?? "desc";

  let q: any = db.collection(coll).orderBy(sortField, sortDir).limit(lim);

  if (filters) {
    for (const [k, v] of Object.entries(filters)) {
      q = q.where(k, "==", v);
    }
  }
  if (cursor) {
    const cursorDoc = await db.collection(coll).doc(cursor).get();
    if (cursorDoc.exists) q = q.startAfter(cursorDoc);
  }

  try {
    const snap = await q.get();
    return {
      items: snap.docs.map((d: any) => {
        const data = d.data();
        // Convert any Firestore Timestamps to milliseconds for JSON transport
        const out: any = { id: d.id };
        for (const [k, v] of Object.entries(data)) {
          if (v && typeof v === "object" && "toMillis" in (v as any)) {
            out[k] = (v as any).toMillis();
          } else {
            out[k] = v;
          }
        }
        return out;
      }),
      nextCursor:
        snap.docs.length === lim ? snap.docs[snap.docs.length - 1].id : null,
    };
  } catch (e: any) {
    // Fallback: no orderBy, no filters — grab raw documents
    logger.warn(
      `adminList fallback triggered for ${coll}: ${e.message}`
    );
    const fallback = await db.collection(coll).limit(lim).get();
    return {
      items: fallback.docs.map((d) => {
        const data = d.data();
        const out: any = { id: d.id };
        for (const [k, v] of Object.entries(data)) {
          if (v && typeof v === "object" && "toMillis" in (v as any)) {
            out[k] = (v as any).toMillis();
          } else {
            out[k] = v;
          }
        }
        return out;
      }),
      nextCursor: null,
    };
  }
});

export const adminUpsert = onCall(CALLABLE_OPTS, async (request) => {
  await requireAdmin(request);
  const { collection: coll, docId, data } = request.data as {
    collection: string;
    docId?: string;
    data: Record<string, any>;
  };

  if (!ADMIN_MANAGED_COLLECTIONS.has(coll)) {
    throw new HttpsError(
      "invalid-argument",
      `Collection "${coll}" not allowed`
    );
  }

  const now = FieldValue.serverTimestamp();
  if (docId) {
    await db.collection(coll).doc(docId).set(
      { ...data, updatedAt: now },
      { merge: true }
    );
    return { id: docId };
  } else {
    const ref = await db.collection(coll).add({
      ...data,
      createdAt: now,
      updatedAt: now,
    });
    return { id: ref.id };
  }
});

export const adminDelete = onCall(CALLABLE_OPTS, async (request) => {
  await requireAdmin(request);
  const { collection: coll, docId } = request.data as {
    collection: string;
    docId: string;
  };

  if (!ADMIN_MANAGED_COLLECTIONS.has(coll)) {
    throw new HttpsError(
      "invalid-argument",
      `Collection "${coll}" not allowed`
    );
  }

  await db.collection(coll).doc(docId).delete();
  return { ok: true };
});

// ─────────────────────────────────────────────────────────
// Reports / Disputes / Users
// ─────────────────────────────────────────────────────────
export const adminResolveReport = onCall(CALLABLE_OPTS, async (request) => {
  const { email } = await requireAdmin(request);
  const { reportId, outcome, moderatorNotes, issueStrike } = request.data as {
    reportId: string;
    outcome:
      | "resolved_dismissed"
      | "resolved_warning"
      | "resolved_refund"
      | "resolved_ban";
    moderatorNotes?: string;
    issueStrike?: boolean;
  };

  const reportRef = db.collection("reports").doc(reportId);
  const reportSnap = await reportRef.get();
  if (!reportSnap.exists) throw new HttpsError("not-found", "Report not found");
  const report = reportSnap.data()!;

  await reportRef.update({
    status: outcome,
    moderatorNotes: moderatorNotes ?? "",
    resolvedBy: email,
    resolvedAt: FieldValue.serverTimestamp(),
  });

  if (issueStrike && report.targetOwnerUid) {
    await db.collection("strikes").add({
      uid: report.targetOwnerUid,
      reason: "other",
      reportId,
      issuedBy: email,
      notes: moderatorNotes ?? "",
      active: true,
      expiresAt: Timestamp.fromDate(
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      ),
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  if (outcome === "resolved_dismissed" && report.reporterUid) {
    await db
      .collection("users")
      .doc(report.reporterUid)
      .update({ guestScore: FieldValue.increment(-10) });
  }

  return { ok: true };
});

export const adminResolveDispute = onCall(CALLABLE_OPTS, async (request) => {
  const { email } = await requireAdmin(request);
  const { disputeId, outcome, moderatorNotes } = request.data as {
    disputeId: string;
    outcome:
      | "full_refund"
      | "partial_refund"
      | "released_to_host"
      | "dismissed";
    moderatorNotes?: string;
  };

  const disputeRef = db.collection("disputes").doc(disputeId);
  const snap = await disputeRef.get();
  if (!snap.exists) throw new HttpsError("not-found", "Dispute not found");
  const dispute = snap.data()!;

  await disputeRef.update({
    outcome,
    moderatorNotes: moderatorNotes ?? "",
    resolvedBy: email,
    resolvedAt: FieldValue.serverTimestamp(),
  });

  if (dispute.planId) {
    await db
      .collection("plans")
      .doc(dispute.planId)
      .update({ hasOpenDispute: false });
  }

  return { ok: true };
});

export const adminUserAction = onCall(CALLABLE_OPTS, async (request) => {
  const { email } = await requireAdmin(request);
  const { uid, action, payload } = request.data as {
    uid: string;
    action:
      | "ban"
      | "unban"
      | "suspend"
      | "unsuspend"
      | "adjustScore"
      | "makeAdmin";
    payload?: any;
  };

  const userRef = db.collection("users").doc(uid);
  const snap = await userRef.get();
  if (!snap.exists) throw new HttpsError("not-found", "User not found");

  switch (action) {
    case "ban":
      await userRef.update({
        isBanned: true,
        bannedAt: FieldValue.serverTimestamp(),
        bannedBy: email,
      });
      break;
    case "unban":
      await userRef.update({ isBanned: false, bannedAt: null });
      break;
    case "suspend": {
      const days = payload?.days ?? 7;
      await userRef.update({
        suspendedUntil: Timestamp.fromDate(
          new Date(Date.now() + days * 24 * 60 * 60 * 1000)
        ),
      });
      break;
    }
    case "unsuspend":
      await userRef.update({ suspendedUntil: null });
      break;
    case "adjustScore": {
      const { field, delta } = payload as { field: string; delta: number };
      if (!["hostScore", "guestScore", "trustBalance"].includes(field)) {
        throw new HttpsError("invalid-argument", "Invalid score field");
      }
      await userRef.update({ [field]: FieldValue.increment(delta) });
      break;
    }
    case "makeAdmin":
      await db.collection("adminUids").doc(uid).set({
        uid,
        email: snap.data()?.email ?? "",
        addedBy: email,
        addedAt: FieldValue.serverTimestamp(),
      });
      break;
    default:
      throw new HttpsError("invalid-argument", "Unknown action");
  }

  return { ok: true };
});