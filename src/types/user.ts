export interface GarbaCrewUser {
  // ─── Identity (Epic 1) ───
  uid: string;
  phone: string | null;
  email: string | null;
  displayName: string | null;
  photoUrl: string | null;
  createdAt: Date;
  profileComplete: boolean;

  // ─── Profile fields (Epic 1) ───
  name?: string;
  age?: number;
  gender?: "male" | "female" | "other";
  city?: string;
  area?: string;
  latitude?: number;
  longitude?: number;
  languages?: string[];
  activities?: string[];
  danceSkill?: "beginner" | "intermediate" | "advanced" | "expert";
  preferredStyles?: string[];
  yearsAttendingNavratri?: number;
  groupSizePreference?: number;
  lookingFor?: "friend" | "partner" | "crew" | "all";
  vibeScore?: number; // 1 = introvert, 10 = extrovert
  favoriteActivitySong?: string;
  postActivityRitual?: string;
  bio?: string;

  // ─── Verification (Epic 1) ───
  isVerified: boolean;
  selfieVerified: boolean;
  selfieEmbedding?: number[];
  profileScore: number;

  // ─── Epic 2: Dual Score & Trust System ───
  /** Reliability score as a host (0-100). Starts at 50. */
  hostScore: number;
  /** Reliability score as a guest (0-100). Starts at 50. */
  guestScore: number;
  /** Non-monetary commitment stake (0-100). Starts at 50. */
  trustBalance: number;
  /** Amount currently held in escrow for pending plans. */
  escrowBalance: number;
  /** Consecutive successful plans completed. */
  streak: number;
  /** Lifetime count of plans hosted. */
  plansHosted: number;
  /** Lifetime count of plans joined as participant. */
  plansJoined: number;
  /** Lifetime count of plans completed (hosted or joined). */
  completedPlans: number;

  // ─── Epic 2: Moderation fields ───
  /** Last time a rating was applied to this user. */
  lastRatedAt?: Date;
  /** If set, user is suspended until this date. */
  suspendedUntil?: Date;
  /** If true, user is permanently banned. */
  isBanned?: boolean;
}

export interface ProfileSetupData {
  photoUri: string | null;
  name: string;
  age: number | null;
  gender: "male" | "female" | "other" | null;
  city: string;
  area: string;
  latitude: number | null;
  longitude: number | null;
  languages: string[];
  activities: string[];
  danceSkill: "beginner" | "intermediate" | "advanced" | "expert" | null;
  preferredStyles: string[];
  yearsAttendingNavratri: number | null;
  groupSizePreference: number | null;
  lookingFor: "friend" | "partner" | "crew" | "all" | null;
  vibeScore: number;
  favoriteActivitySong: string;
  postActivityRitual: string;
  bio: string;
}