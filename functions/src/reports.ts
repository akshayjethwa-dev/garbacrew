import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

const db = getFirestore();

/**
 * Fires when a report is created.
 * - Logs to safetyAlerts collection for admin review
 * - If the reporter has 3+ dismissed reports, penalize with -10 Guest Score
 *   and issue a false-report strike.
 */
export const onReportCreated = onDocumentCreated(
  "reports/{reportId}",
  async (event) => {
    const report = event.data?.data();
    if (!report) return;

    const reportId = event.params.reportId;

    await db.collection("safetyAlerts").add({
      type: "report",
      reportId,
      reporterUid: report.reporterUid,
      targetType: report.targetType,
      targetId: report.targetId,
      targetOwnerUid: report.targetOwnerUid,
      reason: report.reason,
      createdAt: FieldValue.serverTimestamp(),
      status: "open",
    });

    logger.info(`New report: ${report.reason} on ${report.targetType} ${report.targetId}`);

    // Count reporter's dismissed reports
    const dismissedSnap = await db
      .collection("reports")
      .where("reporterUid", "==", report.reporterUid)
      .where("status", "==", "resolved_dismissed")
      .get();

    if (dismissedSnap.size >= 2) {
      // This is the 3rd dismissed report → penalty
      logger.warn(`Reporter ${report.reporterUid} has 3+ dismissed reports`);

      const userRef = db.collection("users").doc(report.reporterUid);
      await userRef.update({
        guestScore: FieldValue.increment(-10),
      });

      // Issue a strike
      const strikeRef = db.collection("strikes").doc();
      await strikeRef.set({
        uid: report.reporterUid,
        reason: "false_report",
        reportId,
        issuedBy: "system",
        notes: "Issued automatically after 3+ dismissed reports",
        active: true,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: FieldValue.serverTimestamp(),
      });
    }
  }
);