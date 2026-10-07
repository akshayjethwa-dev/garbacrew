import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

const db = getFirestore();

/**
 * Fires when a strike is created.
 * Escalates based on active strike count:
 *   Strike 1 → Warning only
 *   Strike 2 → 7-day suspension
 *   Strike 3 → Permanent ban
 */
export const onStrikeCreated = onDocumentCreated(
  "strikes/{strikeId}",
  async (event) => {
    const strike = event.data?.data();
    if (!strike) return;

    const uid = strike.uid;
    const userRef = db.collection("users").doc(uid);

    // Count all active strikes
    const activeSnap = await db
      .collection("strikes")
      .where("uid", "==", uid)
      .where("active", "==", true)
      .get();

    const count = activeSnap.size;
    logger.info(`Strike ${count} issued to ${uid}`);

    if (count === 1) {
      // Warning — already logged, no ban
      await userRef.update({
        lastStrikeAt: FieldValue.serverTimestamp(),
      });
    } else if (count === 2) {
      const suspendUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await userRef.update({
        suspendedUntil: suspendUntil,
        lastStrikeAt: FieldValue.serverTimestamp(),
      });
    } else if (count >= 3) {
      await userRef.update({
        isBanned: true,
        bannedAt: FieldValue.serverTimestamp(),
      });
    }
  }
);

/**
 * Expires strikes after 12 months.
 */
export const expireStrikes = onSchedule(
  {
    schedule: "every day 04:00",
    timeZone: "Asia/Kolkata",
    region: "asia-south1",
  },
  async () => {
    const now = Timestamp.now();
    const snap = await db
      .collection("strikes")
      .where("active", "==", true)
      .where("expiresAt", "<", now)
      .get();

    if (snap.empty) return;

    const batch = db.batch();
    snap.docs.forEach((d) => {
      batch.update(d.ref, { active: false, expiredAt: FieldValue.serverTimestamp() });
    });
    await batch.commit();
    logger.info(`Expired ${snap.size} strikes`);
  }
);