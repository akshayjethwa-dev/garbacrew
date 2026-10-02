export interface GarbaCrewUser {
  uid: string;
  phone: string | null;
  email: string | null;
  displayName: string | null;
  photoUrl: string | null;
  createdAt: Date;
  profileComplete: boolean;
  // Profile fields
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
  // Verification
  isVerified: boolean;
  selfieVerified: boolean;
  selfieEmbedding?: number[];
  profileScore: number;
  // Trust (Epic 2 will use these)
  hostScore: number;
  guestScore: number;
  trustBalance: number;
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