import { onSchedule } from "firebase-functions/v2/scheduler";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

const db = getFirestore();

/**
 * Daily job: archive squads that haven't had activity in 60 days.
 */
export const archiveInactiveSquads = onSchedule(
  { schedule: "every day 03:00", timeZone: "Asia/Kolkata", region: "asia-south1" },
  async () => {
    const cutoff = Timestamp.fromMillis(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const snap = await db
      .collection("squads")
      .where("isArchived", "==", false)
      .where("lastActivityAt", "<", cutoff)
      .get();

    if (snap.empty) return;

    const batch = db.batch();
    snap.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        isArchived: true,
        isActive: false,
        archivedReason: "Inactive for 60 days",
        archivedAt: FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();

    console.log(`Archived ${snap.size} inactive squads`);
  }
);

/**
 * Fires when a squad document is updated.
 * - Logs activity when the squad gains/loses members
 * - Bumps lastActivityAt on any meaningful change
 */
export const onSquadUpdated = onDocumentUpdated(
  "squads/{squadId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    // Skip if archive itself triggered this
    if (!before.isArchived && after.isArchived) return;

    // Bump lastActivityAt if members changed
    if (before.memberUids?.length !== after.memberUids?.length) {
      await event.data!.after.ref.update({
        lastActivityAt: FieldValue.serverTimestamp(),
      });
    }
  }
);