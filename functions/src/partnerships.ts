import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

const db = getFirestore();

/**
 * Monthly: charges retainer fees for active partnerships.
 * In production, this creates Razorpay invoices.
 */
export const chargePartnershipRetainers = onSchedule(
  {
    schedule: "0 6 1 * *", // 6 AM IST on the 1st of every month
    timeZone: "Asia/Kolkata",
    region: "asia-south1",
  },
  async () => {
    const snap = await db
      .collection("partnerships")
      .where("status", "==", "active")
      .get();

    if (snap.empty) {
      logger.info("No active partnerships to charge");
      return;
    }

    for (const d of snap.docs) {
      const partnership = d.data();
      try {
        // TODO: create Razorpay invoice for partnership.monthlyRetainer
        await db.collection("partnershipInvoices").add({
          partnershipId: d.id,
          venueName: partnership.venueName,
          amount: partnership.monthlyRetainer,
          status: "pending",
          createdAt: FieldValue.serverTimestamp(),
        });
        logger.info(`Invoice queued for ${partnership.venueName}`);
      } catch (error) {
        logger.error(`Failed to invoice ${partnership.venueName}`, error);
      }
    }
  }
);