import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

const db = getFirestore();

/**
 * Fires when a vendor submits their application.
 * Sends an alert for the admin team to review.
 */
export const onVendorApplication = onDocumentCreated(
  "vendors/{vendorId}",
  async (event) => {
    const vendor = event.data?.data();
    if (!vendor) return;

    await db.collection("adminAlerts").add({
      type: "vendor_application",
      vendorId: event.params.vendorId,
      name: vendor.name,
      category: vendor.category,
      city: vendor.city,
      createdAt: FieldValue.serverTimestamp(),
      status: "pending",
    });

    logger.info(`Vendor application: ${vendor.name} (${vendor.category})`);
  }
);