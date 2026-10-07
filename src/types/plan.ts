import { Timestamp } from "firebase/firestore";

// ─── Enums ───
export type PlanActivity =
  | "cricket"
  | "trek"
  | "garba"
  | "movie"
  | "food"
  | "party"
  | "custom";

export type PlanStatus =
  | "open"
  | "full"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export type ApprovalMode =
  | "auto"         // Free + auto-approve
  | "manual"       // Free + manual approve
  | "paid_auto"    // Paid + auto-approve
  | "paid_manual"; // Paid + manual approve

export type PlanVisibility = "public" | "squad_only" | "private";

export type SkillLevel = "beginner" | "intermediate" | "advanced";

// ─── Sub-objects ───
export interface PlanRequirements {
  verifiedOnly: boolean;
  womenOnly: boolean;
  minGuestScore: number | null;
  skillLevel: SkillLevel | null;
}

export interface PlanParticipant {
  uid: string;
  name: string;
  photoUrl: string | null;
  guestScore: number;
  joinedAt: Timestamp | any;
  approved: boolean;
}

// ─── Main Plan document ───
export interface Plan {
  id: string;

  // Host info (denormalized for fast reads)
  hostUid: string;
  hostName: string;
  hostPhotoUrl: string | null;
  hostScore: number;
  hostVerified: boolean;

  // Activity
  activity: PlanActivity;
  activityCustom?: string; // only if activity === "custom"
  title: string;
  description: string;

  // Time
  startTime: Timestamp | any;
  endTime: Timestamp | any;
  durationMinutes: number;

  // Location
  locationName: string;
  locationAddress: string;
  city: string;
  latitude: number | null;
  longitude: number | null;

  // Capacity & cost
  capacity: number; // 0 = unlimited
  costTotal: number; // 0 = free
  costPerPerson: number; // computed = costTotal / capacity

  // Configuration
  requirements: PlanRequirements;
  approvalMode: ApprovalMode;
  visibility: PlanVisibility;

  // Participants
  participants: string[]; // uids
  participantDetails: PlanParticipant[];
  spotsFilled: number;

  // Requests & waitlist (used in Sprint 4)
  pendingRequests: string[];
  waitlist: string[];

  // Chat
  chatId: string;

  // Status
  status: PlanStatus;
  createdAt: Timestamp | any;
  updatedAt: Timestamp | any;
}

// ─── Draft type for the create wizard ───
export interface PlanDraft {
  activity: PlanActivity | null;
  activityCustom: string;
  title: string;
  description: string;
  startDate: Date | null;
  startTime: string; // "18:30"
  durationMinutes: number;
  locationName: string;
  locationAddress: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  capacity: number;
  costTotal: number;
  requirements: PlanRequirements;
  approvalMode: ApprovalMode;
  visibility: PlanVisibility;
}

export const EMPTY_PLAN_DRAFT: PlanDraft = {
  activity: null,
  activityCustom: "",
  title: "",
  description: "",
  startDate: null,
  startTime: "",
  durationMinutes: 120,
  locationName: "",
  locationAddress: "",
  city: "",
  latitude: null,
  longitude: null,
  capacity: 6,
  costTotal: 0,
  requirements: {
    verifiedOnly: false,
    womenOnly: false,
    minGuestScore: null,
    skillLevel: null,
  },
  approvalMode: "auto",
  visibility: "public",
};

// ─── Helper: derive approval mode from paid + manual ───
export function getApprovalMode(isPaid: boolean, isManual: boolean): ApprovalMode {
  if (isPaid && isManual) return "paid_manual";
  if (isPaid) return "paid_auto";
  if (isManual) return "manual";
  return "auto";
}

export function isPaidMode(mode: ApprovalMode): boolean {
  return mode === "paid_auto" || mode === "paid_manual";
}

export function isManualMode(mode: ApprovalMode): boolean {
  return mode === "manual" || mode === "paid_manual";
}