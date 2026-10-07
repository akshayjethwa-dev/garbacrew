import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

const db = getFirestore();

/**
 * Fires when a new SOS is created.
 * Sends FCM to all chat participants (if chatId present)
 * and logs the incident for the moderation dashboard.
 */
export const onSOSCreated = onDocumentCreated(
  "sosEvents/{sosId}",
  async (event) => {
    const sos = event.data?.data();
    if (!sos) return;

    const sosId = event.params.sosId;
    logger.info(`SOS triggered by ${sos.userName} (${sos.uid})`);

    // Log the alert for admin
    await db.collection("safetyAlerts").add({
      type: "sos",
      sosId,
      uid: sos.uid,
      userName: sos.userName,
      userPhone: sos.userPhone,
      planId: sos.planId,
      squadId: sos.squadId,
      latitude: sos.latitude,
      longitude: sos.longitude,
      emergencyContacts: sos.emergencyContactsNotified ?? [],
      createdAt: FieldValue.serverTimestamp(),
      status: "open",
    });

    // TODO: Send FCM to chat participants
    // TODO: Send SMS via Twilio/MSG91 to emergency contacts
    // These are integration points. See Epic 10 for FCM setup.
  }
);

/**
 * Expires old SOS events after their 30-minute window.
 */
export const expireSOSEvents = onSchedule(
  {
    schedule: "every 15 minutes",
    timeZone: "Asia/Kolkata",
    region: "asia-south1",
  },
  async () => {
    const now = Timestamp.now();
    const snap = await db
      .collection("sosEvents")
      .where("status", "==", "active")
      .where("expiresAt", "<", now)
      .get();

    if (snap.empty) return;

    const batch = db.batch();
    snap.docs.forEach((d) => {
      batch.update(d.ref, {
        status: "resolved",
        resolvedAt: FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
    logger.info(`Auto-resolved ${snap.size} expired SOS events`);
  }
);