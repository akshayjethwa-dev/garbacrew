import { onSchedule } from "firebase-functions/v2/scheduler";
import {
  getFirestore,
  FieldValue,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase-admin/firestore";

const db = getFirestore();

/**
 * Daily cleanup: mark pending invitations as expired after their expiresAt.
 * Runs every day at 03:30 IST.
 */
export const expireOldInvitations = onSchedule(
  {
    schedule: "every day 03:30",
    timeZone: "Asia/Kolkata",
    region: "asia-south1",
  },
  async () => {
    const now = new Date();

    const snap = await db
      .collection("invitations")
      .where("status", "==", "pending")
      .where("expiresAt", "<", now)
      .get();

    if (snap.empty) {
      console.log("No expired invitations to clean up");
      return;
    }

    const batch = db.batch();

    // Explicit type annotation — prevents "implicitly any" if types are incomplete
    snap.docs.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
      batch.update(docSnap.ref, {
        status: "expired",
        expiredAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    console.log(`Expired ${snap.size} invitations`);
  }
);