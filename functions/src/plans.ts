import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const db = getFirestore();

/**
 * Fires when a new Plan is created.
 * - Increments the host's plan counter (analytics)
 * - Logs an activity event for the feed
 * - (Future) Sends FCM notifications to nearby users
 */
export const onPlanCreated = onDocumentCreated(
  "plans/{planId}",
  async (event) => {
    const plan = event.data?.data();
    if (!plan) return;

    const planId = event.params.planId;

    // Increment the host's plans-created counter
    await db.collection("users").doc(plan.hostUid).update({
      plansCreatedCount: FieldValue.increment(1),
    });

    // Log for the activity feed
    await db.collection("activityFeed").add({
      type: "plan_created",
      planId,
      hostUid: plan.hostUid,
      activity: plan.activity,
      city: plan.city,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
);