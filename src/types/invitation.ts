import { Timestamp } from "firebase/firestore";

export type InvitationType = "plan" | "squad";
export type InvitationStatus = "pending" | "accepted" | "declined" | "expired";

export interface Invitation {
  id: string;

  // What is being invited to
  type: InvitationType;
  targetId: string;         // planId or squadId
  targetTitle: string;      // denormalized for display
  targetActivity: string;   // denormalized for display

  // Who is inviting
  inviterUid: string;
  inviterName: string;
  inviterPhotoUrl: string | null;

  // Who is being invited
  invitedUid: string;
  invitedName: string;

  // Message
  message: string;

  // Lifecycle
  status: InvitationStatus;
  createdAt: Timestamp | any;
  expiresAt: Timestamp | any;
  respondedAt: Timestamp | any | null;
}

export const INVITATION_TTL_DAYS = 7;