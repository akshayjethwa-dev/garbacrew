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

// ─── Epic 4: Squad System ───
export { archiveInactiveSquads, onSquadUpdated } from "./squads";

// ─── Epic 5: Invitation System ───
export { expireOldInvitations } from "./invitations";

// ─── Epic 6: Partner Discovery ───
export { expirePartnerMatches } from "./partners";

// ─── Epic 7: Trust & Safety ───
export { onSOSCreated, expireSOSEvents } from "./sos";
export { onBlockCreated } from "./blocks";
export { onReportCreated } from "./reports";
export { onStrikeCreated, expireStrikes } from "./strikes";
export { onDisputeCreated } from "./disputes";

// ─── Epic 8: Monetization ───
export {
  onCreatePayoutForCompletedPlan,
  processPendingPayouts,
  createSubscriptionCheckout,
  cancelSubscription,
  processExpiredSubscriptions,
  createBoostCheckout,
  confirmBoostPayment,
} from "./monetization";
export { onVendorApplication } from "./vendors";
export { chargePartnershipRetainers } from "./partnerships";