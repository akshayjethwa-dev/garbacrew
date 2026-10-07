import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

const db = getFirestore();

/**
 * Expire partner matches where no first message was sent within 24h.
 * Runs hourly.
 */
export const expirePartnerMatches = onSchedule(
  {
    schedule: "every 60 minutes",
    timeZone: "Asia/Kolkata",
    region: "asia-south1",
  },
  async () => {
    const now = Timestamp.now();

    const snap = await db
      .collection("partnerMatches")
      .where("status", "==", "pending_first_message")
      .where("firstMessageDeadline", "<", now)
      .get();

    if (snap.empty) {
      console.log("No expired matches to clean up");
      return;
    }

    const batch = db.batch();
    snap.docs.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        status: "expired",
        expiredAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    console.log(`Expired ${snap.size} partner matches`);
  }
);