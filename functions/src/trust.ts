import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import {
  SCORE,
  TRUST_BLOCK_JOIN,
  TRUST_WARN_JOIN,
  clampTrust,
} from "./constants";

const db = getFirestore();

/**
 * Called from the client when a user joins a free Plan.
 * Stakes -5 Trust Balance in escrow.
 */
export const stakeTrustBalance = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in");
  }

  const { planId, costPerPerson = 0 } = request.data as {
    planId: string;
    costPerPerson?: number;
  };

  const uid = request.auth.uid;

  // Paid plans use the transaction fee, not Trust Balance staking
  if (costPerPerson > 0) {
    return {
      staked: 0,
      balance: null,
      message: "Paid plan — Trust Balance not staked",
    };
  }

  const userRef = db.collection("users").doc(uid);

  const result = await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) {
      throw new HttpsError("not-found", "User not found");
    }

    const balance = userSnap.data()!.trustBalance ?? 50;

    if (balance < TRUST_BLOCK_JOIN) {
      throw new HttpsError(
        "failed-precondition",
        `Trust Balance too low (${balance}). Minimum ${TRUST_BLOCK_JOIN} required to join any Plan.`
      );
    }

    const newBalance = clampTrust(balance + SCORE.TRUST_JOIN_STAKE);

    tx.update(userRef, {
      trustBalance: newBalance,
      escrowBalance: FieldValue.increment(5),
    });

    // Record the escrow entry
    const escrowRef = db.collection("escrow").doc();
    tx.set(escrowRef, {
      uid,
      planId,
      amount: 5,
      status: "held",
      createdAt: FieldValue.serverTimestamp(),
    });

    return { staked: 5, balance: newBalance };
  });

  return {
    ...result,
    warning:
      result.balance < TRUST_WARN_JOIN
        ? `Low Trust Balance (${result.balance}). Be careful — you're close to being blocked from joining Plans.`
        : null,
  };
});

/**
 * Called when a user shows up to a Plan.
 * Returns escrow + bonus: +10 Trust Balance on show-up.
 */
export const releaseTrustBalance = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in");
  }

  const { planId, outcome } = request.data as {
    planId: string;
    outcome: "showed_up" | "no_show" | "cancelled_early" | "cancelled_late";
  };

  const uid = request.auth.uid;
  const userRef = db.collection("users").doc(uid);

  const result = await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) {
      throw new HttpsError("not-found", "User not found");
    }

    const user = userSnap.data()!;
    let delta = 0;
    let escrowRelease = 0;

    switch (outcome) {
      case "showed_up":
        delta = SCORE.TRUST_SHOW_UP; // +10 (5 escrow + 5 earned)
        escrowRelease = 5;
        break;
      case "no_show":
        delta = 0; // escrow burned
        escrowRelease = 5; // decrement escrowBalance regardless
        break;
      case "cancelled_early":
        delta = 5; // escrow returned only (0 net from original -5)
        escrowRelease = 5;
        break;
      case "cancelled_late":
        delta = 5 + SCORE.TRUST_LATE_CANCEL; // +5 escrow - 3 penalty = +2
        escrowRelease = 5;
        break;
    }

    const newBalance = clampTrust((user.trustBalance ?? 50) + delta);

    tx.update(userRef, {
      trustBalance: newBalance,
      escrowBalance: FieldValue.increment(-escrowRelease),
    });

    return { delta, balance: newBalance };
  });

  // Log the event for the Trust Dashboard history
  await db.collection("scoreEvents").add({
    type: `trust_${outcome}`,
    uid,
    planId,
    delta: result.delta,
    createdAt: FieldValue.serverTimestamp(),
  });

  return result;
});