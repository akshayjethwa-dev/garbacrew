import {
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { GarbaCrewUser } from "../types/user";

/**
 * Search users by name (prefix match), excluding self and already-members.
 */
export async function searchUsersByName({
  searchTerm,
  excludeUids,
  maxResults = 20,
}: {
  searchTerm: string;
  excludeUids: string[];
  maxResults?: number;
}): Promise<GarbaCrewUser[]> {
  const trimmed = searchTerm.trim();
  if (trimmed.length < 2) return [];

  // Firestore prefix search: lower and upper bound trick
  const start = trimmed.toLowerCase();
  const end = start + "\uf8ff";

  const q = query(
    collection(db, "users"),
    where("nameLower", ">=", start),
    where("nameLower", "<=", end),
    limit(maxResults)
  );

  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ uid: d.id, ...d.data() } as GarbaCrewUser))
    .filter((u) => !excludeUids.includes(u.uid) && !!u.profileComplete);
}

/**
 * Suggested users to invite: same city, same activity preference, high guest score.
 * Excludes self and existing members.
 */
export async function suggestInvitees({
  city,
  activity,
  excludeUids,
  maxResults = 10,
}: {
  city: string;
  activity: string;
  excludeUids: string[];
  maxResults?: number;
}): Promise<GarbaCrewUser[]> {
  const q = query(
    collection(db, "users"),
    where("city", "==", city),
    where("activities", "array-contains", activity),
    where("profileComplete", "==", true),
    limit(maxResults + excludeUids.length + 1)
  );

  try {
    const snap = await getDocs(q);
    const users = snap.docs
      .map((d) => ({ uid: d.id, ...d.data() } as GarbaCrewUser))
      .filter((u) => !excludeUids.includes(u.uid));

    // Sort by guest score descending, take top N
    users.sort((a, b) => (b.guestScore ?? 50) - (a.guestScore ?? 50));
    return users.slice(0, maxResults);
  } catch (e) {
    // Fallback: if the composite index isn't ready, return an empty list
    // rather than crash. The user can still search by name.
    console.warn("suggestInvitees failed:", e);
    return [];
  }
}