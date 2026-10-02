import { db } from "../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { GarbaCrewUser } from "../types/user";

/**
 * Compute profile score (0-100) based on fields filled.
 */
export function computeProfileScore(data: {
  photoUri?: string | null;
  photoUrl?: string | null;
  name?: string;
  age?: number | null;
  gender?: string | null;
  city?: string;
  languages?: string[];
  activities?: string[];
  danceSkill?: string | null;
  vibeScore?: number;
  bio?: string;
  favoriteActivitySong?: string;
  postActivityRitual?: string;
}): number {
  let score = 0;

  // Photo: +10
  if (data.photoUri || data.photoUrl) score += 10;

  // Name: +10
  if (data.name?.trim()) score += 10;

  // Age: +5
  if (data.age && data.age >= 18) score += 5;

  // Gender: +5
  if (data.gender) score += 5;

  // City: +5
  if (data.city) score += 5;

  // Languages: +5 (at least 1)
  if (data.languages && data.languages.length > 0) score += 5;

  // Activities: +10 (at least 2)
  if (data.activities && data.activities.length >= 2) score += 10;
  else if (data.activities && data.activities.length === 1) score += 5;

  // Dance skill: +10
  if (data.danceSkill) score += 10;

  // Vibe: +5
  if (data.vibeScore !== undefined && data.vibeScore !== 5) score += 5;

  // Bio: +5
  if (data.bio?.trim()) score += 5;

  // Favorite song: +5
  if (data.favoriteActivitySong?.trim()) score += 5;

  // Post-activity ritual: +5
  if (data.postActivityRitual?.trim()) score += 5;

  return Math.min(score, 100);
}

/**
 * Get profile tips based on score.
 */
export function getProfileTips(score: number): string[] {
  const tips: string[] = [];
  if (score < 50) tips.push("Your profile is incomplete. Add more details to be more discoverable.");
  if (score < 70) tips.push("Add a bio to tell others about yourself.");
  if (score < 85) tips.push("Complete your dance skill and vibe preferences.");
  if (score < 100) tips.push("Verify your identity to get a verified badge.");
  return tips;
}

/**
 * Fetch full user profile.
 */
export async function getUserProfile(uid: string): Promise<GarbaCrewUser | null> {
  const docRef = doc(db, "users", uid);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return { uid, ...snap.data() } as GarbaCrewUser;
  }
  return null;
}