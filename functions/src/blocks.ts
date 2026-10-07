import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

const db = getFirestore();

/**
 * Fires when a block is created.
 * Cleans up mutual memberships:
 *   - Removes both users from each other's Squads
 *   - Removes the blocked user from any Plans owned by the blocker
 *   - Removes the blocker from any Plans owned by the blocked user
 */
export const onBlockCreated = onDocumentCreated(
  "blocks/{blockId}",
  async (event) => {
    const block = event.data?.data();
    if (!block) return;

    const { blockerUid, blockedUid } = block;
    logger.info(`Cleanup after block: ${blockerUid} blocked ${blockedUid}`);

    // 1. Remove from each other's Squads
    const blockerSquads = await db
      .collection("squads")
      .where("memberUids", "array-contains", blockerUid)
      .get();

    for (const squadDoc of blockerSquads.docs) {
      const squad = squadDoc.data();
      if (!squad.memberUids?.includes(blockedUid)) continue;
      await squadDoc.ref.update({
        memberUids: squad.memberUids.filter((u: string) => u !== blockedUid),
        memberDetails: (squad.memberDetails ?? []).filter(
          (m: any) => m.uid !== blockedUid
        ),
        coAdminUids: (squad.coAdminUids ?? []).filter(
          (u: string) => u !== blockedUid
        ),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    const blockedSquads = await db
      .collection("squads")
      .where("memberUids", "array-contains", blockedUid)
      .get();

    for (const squadDoc of blockedSquads.docs) {
      const squad = squadDoc.data();
      if (!squad.memberUids?.includes(blockerUid)) continue;
      await squadDoc.ref.update({
        memberUids: squad.memberUids.filter((u: string) => u !== blockerUid),
        memberDetails: (squad.memberDetails ?? []).filter(
          (m: any) => m.uid !== blockerUid
        ),
        coAdminUids: (squad.coAdminUids ?? []).filter(
          (u: string) => u !== blockerUid
        ),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // 2. Remove blocked user from blocker's Plans
    const blockerPlans = await db
      .collection("plans")
      .where("hostUid", "==", blockerUid)
      .where("status", "in", ["open", "full"])
      .get();

    for (const planDoc of blockerPlans.docs) {
      const plan = planDoc.data();
      if (!plan.participants?.includes(blockedUid)) continue;
      await planDoc.ref.update({
        participants: plan.participants.filter((u: string) => u !== blockedUid),
        participantDetails: (plan.participantDetails ?? []).filter(
          (p: any) => p.uid !== blockedUid
        ),
        spotsFilled: Math.max(0, (plan.spotsFilled ?? 1) - 1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // 3. Remove blocker from blocked user's Plans
    const blockedPlans = await db
      .collection("plans")
      .where("hostUid", "==", blockedUid)
      .where("status", "in", ["open", "full"])
      .get();

    for (const planDoc of blockedPlans.docs) {
      const plan = planDoc.data();
      if (!plan.participants?.includes(blockerUid)) continue;
      await planDoc.ref.update({
        participants: plan.participants.filter((u: string) => u !== blockerUid),
        participantDetails: (plan.participantDetails ?? []).filter(
          (p: any) => p.uid !== blockerUid
        ),
        spotsFilled: Math.max(0, (plan.spotsFilled ?? 1) - 1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    logger.info(`Cleanup complete for block ${event.params.blockId}`);
  }
);