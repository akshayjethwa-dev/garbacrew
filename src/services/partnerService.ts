import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { GarbaCrewUser } from "../types/user";
import {
  PartnerCandidate,
  PartnerFilters,
  PartnerMatch,
  SwipeDirection,
  MATCH_FIRST_MESSAGE_HOURS,
} from "../types/partner";

// ─────────────────────────────────────────────────────────
// Candidate fetching
// ─────────────────────────────────────────────────────────
export async function getPartnerCandidates(
  me: GarbaCrewUser,
  filters: PartnerFilters,
  max: number = 30
): Promise<PartnerCandidate[]> {
  // Step 1: fetch a broad set of partner-enabled users in my city
  // (firestore can't combine lookingForPartner + age range + city without
  // a lot of composite indexes, so we filter client-side)
  const q = query(
    collection(db, "users"),
    where("lookingForPartner", "==", true),
    where("profileComplete", "==", true),
    limit(100)
  );

  const snap = await getDocs(q);

  // Step 2: fetch my existing swipes so we can exclude them
  const swipesSnap = await getDocs(
    query(
      collection(db, "partnerSwipes"),
      where("fromUid", "==", me.uid)
    )
  );
  const swipedUids = new Set(
    swipesSnap.docs.map((d) => (d.data() as any).toUid as string)
  );

  // Step 3: fetch my matches
  const matchesSnap = await getDocs(
    query(
      collection(db, "partnerMatches"),
      where("users", "array-contains", me.uid)
    )
  );
  const matchedUids = new Set(
    matchesSnap.docs
      .map((d) => d.data() as any)
      .map((m) => (m.users as string[]).find((u) => u !== me.uid))
      .filter(Boolean) as string[]
  );

  // Step 4: filter candidates
  const candidates: PartnerCandidate[] = [];

  snap.docs.forEach((d) => {
    const u = { uid: d.id, ...d.data() } as GarbaCrewUser;

    if (u.uid === me.uid) return;
    if (swipedUids.has(u.uid)) return;
    if (matchedUids.has(u.uid)) return;
    if (!u.age || !u.gender) return;

    // Gender filter
    if (filters.gender !== "any" && u.gender !== filters.gender) return;

    // Age range
    if (u.age < filters.ageMin || u.age > filters.ageMax) return;

    // City filter
    if (filters.city && u.city !== filters.city) return;

    // Verified only
    if (filters.verifiedOnly && !u.isVerified) return;

    // Vibe filter
    if (filters.vibe && u.partnerVibe !== filters.vibe) return;

    // Activities — at least one overlap
    if (filters.activities.length > 0) {
      const overlap = (u.activities ?? []).filter((a) =>
        filters.activities.includes(a)
      );
      if (overlap.length === 0) return;
    }

    candidates.push({
      uid: u.uid,
      name: u.name ?? "Someone",
      age: u.age,
      gender: u.gender as any,
      photoUrl: u.photoUrl ?? null,
      city: u.city ?? "",
      bio: u.bio,
      activities: u.activities,
      vibeScore: u.vibeScore,
      partnerVibe: u.partnerVibe,
      isVerified: u.isVerified ?? false,
    });
  });

  return candidates.slice(0, max);
}

// ─────────────────────────────────────────────────────────
// Swipe + match
// ─────────────────────────────────────────────────────────
export async function recordSwipe(
  me: GarbaCrewUser,
  targetUid: string,
  direction: SwipeDirection
): Promise<{ matched: boolean; matchId?: string }> {
  const swipeId = `${me.uid}_${targetUid}`;
  const swipeRef = doc(db, "partnerSwipes", swipeId);

  await setDoc(swipeRef, {
    fromUid: me.uid,
    toUid: targetUid,
    direction,
    createdAt: serverTimestamp(),
  });

  // A super like always counts as a "right" swipe for matching purposes
  if (direction === "left") return { matched: false };

  // Check for reciprocal swipe
  const reverseId = `${targetUid}_${me.uid}`;
  const reverseSnap = await getDoc(doc(db, "partnerSwipes", reverseId));
  if (!reverseSnap.exists()) return { matched: false };

  const reverse = reverseSnap.data() as any;
  if (reverse.direction === "left") return { matched: false };

  // Match! Create a match doc.
  const sorted = [me.uid, targetUid].sort();
  const matchId = `${sorted[0]}_${sorted[1]}`;

  // Check if already exists
  const existing = await getDoc(doc(db, "partnerMatches", matchId));
  if (existing.exists()) {
    return { matched: true, matchId };
  }

  // Fetch target user for denormalization
  const targetSnap = await getDoc(doc(db, "users", targetUid));
  const target = targetSnap.exists()
    ? (targetSnap.data() as GarbaCrewUser)
    : null;

  if (!target) return { matched: false };

  const deadline = Timestamp.fromDate(
    new Date(Date.now() + MATCH_FIRST_MESSAGE_HOURS * 60 * 60 * 1000)
  );

  await setDoc(doc(db, "partnerMatches", matchId), {
    users: sorted,
    // Denormalized for quick rendering by both sides
    [`profiles.${me.uid}`]: {
      name: me.name ?? "Someone",
      photoUrl: me.photoUrl ?? null,
      gender: me.gender ?? "other",
    },
    [`profiles.${targetUid}`]: {
      name: target.name ?? "Someone",
      photoUrl: target.photoUrl ?? null,
      gender: target.gender ?? "other",
    },
    matchedAt: serverTimestamp(),
    lastMessageAt: null,
    lastMessage: null,
    firstMessageBy: null,
    firstMessageDeadline: deadline,
    status: "pending_first_message",
    superLike: direction === "super" || reverse.direction === "super",
  });

  return { matched: true, matchId };
}

// ─────────────────────────────────────────────────────────
// Matches
// ─────────────────────────────────────────────────────────
export async function getMyMatches(uid: string): Promise<PartnerMatch[]> {
  const q = query(
    collection(db, "partnerMatches"),
    where("users", "array-contains", uid)
  );
  const snap = await getDocs(q);

  const matches: PartnerMatch[] = snap.docs.map((d) => {
    const data = d.data() as any;
    const otherUid = (data.users as string[]).find((u) => u !== uid)!;
    const otherProfile = data.profiles?.[otherUid] ?? {};

    return {
      id: d.id,
      users: data.users,
      otherUid,
      otherName: otherProfile.name ?? "Someone",
      otherPhotoUrl: otherProfile.photoUrl ?? null,
      otherGender: otherProfile.gender ?? "other",
      matchedAt: data.matchedAt,
      lastMessageAt: data.lastMessageAt,
      lastMessage: data.lastMessage,
      firstMessageBy: data.firstMessageBy,
      firstMessageDeadline: data.firstMessageDeadline,
      status: data.status,
      superLike: data.superLike ?? false,
    };
  });

  // Sort client-side (most recent message first, then most recent match)
  matches.sort((a, b) => {
    const aT = a.lastMessageAt?.toMillis?.() ?? a.matchedAt?.toMillis?.() ?? 0;
    const bT = b.lastMessageAt?.toMillis?.() ?? b.matchedAt?.toMillis?.() ?? 0;
    return bT - aT;
  });

  return matches;
}

export async function getMatchById(matchId: string): Promise<PartnerMatch | null> {
  const snap = await getDoc(doc(db, "partnerMatches", matchId));
  if (!snap.exists()) return null;
  const data = snap.data() as any;
  return {
    id: snap.id,
    users: data.users,
    otherUid: "", // caller sets
    otherName: "",
    otherPhotoUrl: null,
    otherGender: "other",
    matchedAt: data.matchedAt,
    lastMessageAt: data.lastMessageAt,
    lastMessage: data.lastMessage,
    firstMessageBy: data.firstMessageBy,
    firstMessageDeadline: data.firstMessageDeadline,
    status: data.status,
    superLike: data.superLike ?? false,
  };
}

// ─────────────────────────────────────────────────────────
// First message rule (women-first when applicable)
// ─────────────────────────────────────────────────────────
export function canISendFirstMessage(
  match: PartnerMatch,
  myUid: string,
  myGender: "male" | "female" | "other"
): { allowed: boolean; reason?: string } {
  if (match.firstMessageBy) {
    return { allowed: true }; // first message already sent; either can now chat
  }

  if (match.status === "expired") {
    return { allowed: false, reason: "This match has expired." };
  }

  // Gender rule: women message first in mixed-gender matches
  if (myGender === "male" && match.otherGender === "female") {
    return {
      allowed: false,
      reason: "In matches with women, she sends the first message. Be patient! 💫",
    };
  }

  return { allowed: true };
}

// ─────────────────────────────────────────────────────────
// Send first message
// ─────────────────────────────────────────────────────────
export async function sendMatchMessage(
  matchId: string,
  me: GarbaCrewUser,
  text: string
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;

  const matchRef = doc(db, "partnerMatches", matchId);
  const matchSnap = await getDoc(matchRef);
  if (!matchSnap.exists()) throw new Error("Match not found");
  const match = matchSnap.data() as any;

  // Add message to subcollection
  const msgRef = doc(collection(db, "partnerMatches", matchId, "messages"));
  await setDoc(msgRef, {
    fromUid: me.uid,
    text: trimmed,
    createdAt: serverTimestamp(),
  });

  // Update match summary
  const updates: any = {
    lastMessage: trimmed.length > 60 ? trimmed.slice(0, 60) + "…" : trimmed,
    lastMessageAt: serverTimestamp(),
    status: "active",
  };
  if (!match.firstMessageBy) {
    updates.firstMessageBy = me.uid;
  }
  await updateDoc(matchRef, updates);
}

// ─────────────────────────────────────────────────────────
// Partner mode toggle helpers
// ─────────────────────────────────────────────────────────
export async function setPartnerMode(
  uid: string,
  enabled: boolean,
  partnerVibe?: string
): Promise<void> {
  const updates: any = { lookingForPartner: enabled };
  if (enabled && partnerVibe) updates.partnerVibe = partnerVibe;
  await updateDoc(doc(db, "users", uid), updates);
}