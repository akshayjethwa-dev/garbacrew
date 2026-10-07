/**
 * GarbaCrew Cloud Functions — Entry Point
 *
 * Epic 2: Dual Score & Trust System
 */

import { setGlobalOptions } from "firebase-functions";

// Global options — pins ALL functions to Mumbai (matches Firestore region)
setGlobalOptions({
  maxInstances: 10,
  region: "asia-south1",
});

// ─── Epic 2: Dual Score & Trust System ───
export { onPlanStatusChange } from "./scores";
export { onRatingCreated } from "./ratings";
export { stakeTrustBalance, releaseTrustBalance } from "./trust";