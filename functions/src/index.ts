/**
 * GarbaCrew Cloud Functions — Entry Point
 */

import { setGlobalOptions } from "firebase-functions";

setGlobalOptions({
  maxInstances: 10,
  region: "asia-south1",
});

// ─── Epic 2: Dual Score & Trust System ───
export { onPlanStatusChange } from "./scores";
export { onRatingCreated } from "./ratings";
export { stakeTrustBalance, releaseTrustBalance } from "./trust";

// ─── Epic 3: Plan System ───
export { onPlanCreated } from "./plans";