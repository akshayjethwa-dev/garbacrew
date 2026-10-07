import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

const db = getFirestore();

/**
 * Fires when a dispute is filed.
 * - Marks the associated plan's escrow as "in dispute" so funds are held
 * - Logs to safetyAlerts for admin review
 */
export const onDisputeCreated = onDocumentCreated(
  "disputes/{disputeId}",
  async (event) => {
    const dispute = event.data?.data();
    if (!dispute) return;

    const disputeId = event.params.disputeId;
    const planId = dispute.planId;

    // Mark the plan as having an open dispute
    if (planId) {
      const planRef = db.collection("plans").doc(planId);
      try {
        await planRef.update({
          hasOpenDispute: true,
          disputeId,
          updatedAt: FieldValue.serverTimestamp(),
        });
      } catch (e) {
        logger.warn(`Could not update plan ${planId} with dispute flag`, e);
      }
    }

    await db.collection("safetyAlerts").add({
      type: "dispute",
      disputeId,
      planId,
      filedByUid: dispute.filedByUid,
      againstUid: dispute.againstUid,
      amount: dispute.amount,
      createdAt: FieldValue.serverTimestamp(),
      status: "open",
    });

    logger.info(`Dispute filed for ₹${dispute.amount} on plan ${planId}`);
  }
);