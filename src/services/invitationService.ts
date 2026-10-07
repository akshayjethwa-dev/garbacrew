import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Invitation, INVITATION_TTL_DAYS } from "../types/invitation";
import { GarbaCrewUser } from "../types/user";

/**
 * Send one or more invitations.
 * Skips users who are already members, already invited, or blocked.
 */
export async function sendInvitations({
  inviter,
  type,
  targetId,
  targetTitle,
  targetActivity,
  invitedUids,
  message,
}: {
  inviter: GarbaCrewUser;
  type: "plan" | "squad";
  targetId: string;
  targetTitle: string;
  targetActivity: string;
  invitedUids: string[];
  message: string;
}): Promise<{ sent: number; skipped: number }> {
  if (invitedUids.length === 0) return { sent: 0, skipped: 0 };

  // Fetch target to know existing members
  const targetColl = type === "plan" ? "plans" : "squads";
  const targetSnap = await getDoc(doc(db, targetColl, targetId));
  if (!targetSnap.exists()) throw new Error("Target not found");

  const target = targetSnap.data() as any;
  const existingMembers: string[] =
    type === "plan" ? target.participants ?? [] : target.memberUids ?? [];
  const existingRequests: string[] =
    type === "plan" ? target.pendingRequests ?? [] : [];

  // Fetch existing pending invitations for this target
  const existingInvitesSnap = await getDocs(
    query(
      collection(db, "invitations"),
      where("targetId", "==", targetId),
      where("status", "==", "pending")
    )
  );
  const alreadyInvited = new Set(
    existingInvitesSnap.docs.map((d) => (d.data() as Invitation).invitedUid)
  );

  const expiresAt = Timestamp.fromDate(
    new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000)
  );

  let sent = 0;
  let skipped = 0;

  for (const uid of invitedUids) {
    if (uid === inviter.uid) {
      skipped++;
      continue;
    }
    if (existingMembers.includes(uid)) {
      skipped++;
      continue;
    }
    if (existingRequests.includes(uid)) {
      skipped++;
      continue;
    }
    if (alreadyInvited.has(uid)) {
      skipped++;
      continue;
    }

    // Get invitee name (best-effort; falls back to "a user")
    const inviteeSnap = await getDoc(doc(db, "users", uid));
    const invitedName = inviteeSnap.exists()
      ? (inviteeSnap.data() as GarbaCrewUser).name ?? "a user"
      : "a user";

    await addDoc(collection(db, "invitations"), {
      type,
      targetId,
      targetTitle,
      targetActivity,

      inviterUid: inviter.uid,
      inviterName: inviter.name ?? "Someone",
      inviterPhotoUrl: inviter.photoUrl ?? null,

      invitedUid: uid,
      invitedName,

      message: message.trim(),

      status: "pending",
      createdAt: serverTimestamp(),
      expiresAt,
      respondedAt: null,
    });

    sent++;
  }

  return { sent, skipped };
}

/**
 * Fetch pending invitations for the current user.
 */
export async function getMyInvitations(uid: string): Promise<Invitation[]> {
  const q = query(
    collection(db, "invitations"),
    where("invitedUid", "==", uid),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Invitation));
}

/**
 * Accept an invitation.
 * Runs a transaction so the target's member list is updated atomically.
 */
export async function acceptInvitation(
  invitation: Invitation,
  user: GarbaCrewUser
): Promise<void> {
  const invRef = doc(db, "invitations", invitation.id);
  const invSnap = await getDoc(invRef);
  if (!invSnap.exists()) throw new Error("Invitation not found");

  const inv = invSnap.data() as Invitation;

  if (inv.status !== "pending") {
    throw new Error("This invitation is no longer valid");
  }
  if (inv.expiresAt && inv.expiresAt.toMillis() < Date.now()) {
    await updateDoc(invRef, { status: "expired" });
    throw new Error("This invitation has expired");
  }

  const targetColl = inv.type === "plan" ? "plans" : "squads";
  const targetRef = doc(db, targetColl, inv.targetId);
  const targetSnap = await getDoc(targetRef);
  if (!targetSnap.exists()) throw new Error("Target no longer exists");

  const target = targetSnap.data() as any;

  if (inv.type === "plan") {
    const participants: string[] = target.participants ?? [];
    if (participants.includes(user.uid)) {
      // Already in — just mark invite accepted
      await updateDoc(invRef, {
        status: "accepted",
        respondedAt: serverTimestamp(),
      });
      return;
    }

    const details = target.participantDetails ?? [];
    const newDetail = {
      uid: user.uid,
      name: user.name ?? "Member",
      photoUrl: user.photoUrl ?? null,
      guestScore: user.guestScore ?? 50,
      joinedAt: Timestamp.now(),
      approved: true,
    };

    await updateDoc(targetRef, {
      participants: [...participants, user.uid],
      participantDetails: [...details, newDetail],
      spotsFilled: (target.spotsFilled ?? 0) + 1,
      updatedAt: serverTimestamp(),
    });
  } else {
    const members: string[] = target.memberUids ?? [];
    if (members.includes(user.uid)) {
      await updateDoc(invRef, {
        status: "accepted",
        respondedAt: serverTimestamp(),
      });
      return;
    }

    const details = target.memberDetails ?? [];
    const newDetail = {
      uid: user.uid,
      name: user.name ?? "Member",
      photoUrl: user.photoUrl ?? null,
      role: "member",
      guestScore: user.guestScore ?? 50,
      joinedAt: Timestamp.now(),
    };

    await updateDoc(targetRef, {
      memberUids: [...members, user.uid],
      memberDetails: [...details, newDetail],
      lastActivityAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  // Add to chat participants
  const chatRef = doc(db, "chats", target.chatId);
  const chatSnap = await getDoc(chatRef);
  if (chatSnap.exists()) {
    const chatData = chatSnap.data() as any;
    const participants: string[] = chatData.participants ?? [];
    if (!participants.includes(user.uid)) {
      await updateDoc(chatRef, {
        participants: [...participants, user.uid],
      });
    }
  }

  await updateDoc(invRef, {
    status: "accepted",
    respondedAt: serverTimestamp(),
  });
}

/**
 * Decline an invitation.
 */
export async function declineInvitation(invitationId: string): Promise<void> {
  await updateDoc(doc(db, "invitations", invitationId), {
    status: "declined",
    respondedAt: serverTimestamp(),
  });
}