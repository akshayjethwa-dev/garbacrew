import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { initializeApp } from "firebase-admin/app";
import { SCORE } from "./constants";

initializeApp();
const db = getFirestore();

type PlanStatus =
  | "open"
  | "full"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

interface PlanDoc {
  hostUid: string;
  participants: string[];
  status: PlanStatus;
  cancelledBy?: string;
  cancellationReason?: string;
  completedAt?: FirebaseFirestore.Timestamp;
  costPerPerson?: number;
  isPaid?: boolean;
  startTime?: FirebaseFirestore.Timestamp;
}

/**
 * Fires when any plan document is updated.
 * Applies score deltas based on the status transition.
 */
export const onPlanStatusChange = onDocumentUpdated(
  "plans/{planId}",
  async (event) => {
    const before = event.data?.before.data() as PlanDoc | undefined;
    const after = event.data?.after.data() as PlanDoc | undefined;

    if (!before || !after) return;
    if (before.status === after.status) return; // no status change

    const planId = event.params.planId;

    switch (after.status) {
      case "completed":
        await handlePlanCompleted(planId, after);
        break;
      case "cancelled":
        await handlePlanCancelled(planId, after);
        break;
      case "no_show":
        await handlePlanNoShow(planId, after);
        break;
      default:
        break;
    }
  }
);

/**
 * Plan completed successfully.
 * Host: +15 Host Score, each participant: +10 Guest Score.
 * All: +10 Trust Balance returned (5 escrow + 5 earned).
 */
async function handlePlanCompleted(planId: string, plan: PlanDoc) {
  const batch = db.batch();

  // Update host
  const hostRef = db.collection("users").doc(plan.hostUid);
  batch.update(hostRef, {
    hostScore: FieldValue.increment(SCORE.HOST_PLAN_COMPLETED),
    trustBalance: FieldValue.increment(SCORE.TRUST_SHOW_UP),
    plansHosted: FieldValue.increment(1),
    completedPlans: FieldValue.increment(1),
  });

  // Update each participant
  for (const uid of plan.participants) {
    const ref = db.collection("users").doc(uid);
    batch.update(ref, {
      guestScore: FieldValue.increment(SCORE.GUEST_PLAN_COMPLETED),
      trustBalance: FieldValue.increment(SCORE.TRUST_SHOW_UP),
      plansJoined: FieldValue.increment(1),
      completedPlans: FieldValue.increment(1),
      streak: FieldValue.increment(1),
    });
  }

  await batch.commit();

  // Log the transaction for the Trust Dashboard
  await db.collection("scoreEvents").add({
    type: "plan_completed",
    planId,
    hostUid: plan.hostUid,
    participantUids: plan.participants,
    delta: SCORE.HOST_PLAN_COMPLETED,
    createdAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Plan cancelled by host.
 * Tiered penalties based on how close to start time.
 */
async function handlePlanCancelled(planId: string, plan: PlanDoc) {
  const batch = db.batch();
  const hostRef = db.collection("users").doc(plan.hostUid);

  // Compute hours until start
  let hoursUntilStart = 48; // default fallback
  if (plan.startTime) {
    const startMs = plan.startTime.toMillis();
    hoursUntilStart = (startMs - Date.now()) / (1000 * 60 * 60);
  }

  let hostPenalty = 0;
  if (hoursUntilStart >= 168) hostPenalty = -2;       // 7+ days
  else if (hoursUntilStart >= 72) hostPenalty = -5;   // 3-7 days
  else if (hoursUntilStart >= 24) hostPenalty = -10;  // 24-72h
  else hostPenalty = -20;                              // <24h

  batch.update(hostRef, {
    hostScore: FieldValue.increment(hostPenalty),
  });

  // Participants get escrow back if >24h before start
  if (hoursUntilStart >= 24) {
    for (const uid of plan.participants) {
      const ref = db.collection("users").doc(uid);
      batch.update(ref, {
        trustBalance: FieldValue.increment(5), // return escrow only
        escrowBalance: FieldValue.increment(-5),
      });
    }
  }

  await batch.commit();

  await db.collection("scoreEvents").add({
    type: "plan_cancelled",
    planId,
    hostUid: plan.hostUid,
    hoursUntilStart: Math.round(hoursUntilStart),
    delta: hostPenalty,
    createdAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Host no-showed.
 * -30 Host Score, full refund to participants, 30-day suspension.
 */
async function handlePlanNoShow(planId: string, plan: PlanDoc) {
  const batch = db.batch();
  const hostRef = db.collection("users").doc(plan.hostUid);

  batch.update(hostRef, {
    hostScore: FieldValue.increment(SCORE.HOST_NO_SHOW),
    suspendedUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  // Refund participants' trust balance fully (escrow returned, no penalty)
  for (const uid of plan.participants) {
    const ref = db.collection("users").doc(uid);
    batch.update(ref, {
      trustBalance: FieldValue.increment(5),
      escrowBalance: FieldValue.increment(-5),
    });
  }

  await batch.commit();

  await db.collection("scoreEvents").add({
    type: "plan_no_show",
    planId,
    hostUid: plan.hostUid,
    delta: SCORE.HOST_NO_SHOW,
    createdAt: FieldValue.serverTimestamp(),
  });
}