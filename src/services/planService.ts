import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  startAfter,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { Plan, PlanDraft, getApprovalMode } from "../types/plan";
import { GarbaCrewUser } from "../types/user";

/**
 * Create a new Plan in Firestore.
 * Uses a pre-generated doc ID so we can set chatId = planId.
 */
export async function createPlan(
  host: GarbaCrewUser,
  draft: PlanDraft
): Promise<string> {
  if (!draft.activity) throw new Error("Activity is required");
  if (!draft.title.trim()) throw new Error("Title is required");
  if (!draft.startDate || !draft.startTime) throw new Error("Date/time is required");
  if (!draft.city) throw new Error("City is required");

  // Compute start and end times
  const [hh, mm] = draft.startTime.split(":").map(Number);
  const start = new Date(draft.startDate);
  start.setHours(hh, mm, 0, 0);

  if (start.getTime() < Date.now()) {
    throw new Error("Plan start time must be in the future");
  }

  const end = new Date(start.getTime() + draft.durationMinutes * 60 * 1000);

  // Compute cost per person
  const costPerPerson =
    draft.capacity > 0 ? Math.round(draft.costTotal / draft.capacity) : 0;

  // Pre-generate the doc ref to get the ID for chatId
  const plansRef = collection(db, "plans");
  const newPlanRef = doc(plansRef);
  const planId = newPlanRef.id;

  const planDoc = {
    hostUid: host.uid,
    hostName: host.name ?? "Someone",
    hostPhotoUrl: host.photoUrl ?? null,
    hostScore: host.hostScore ?? 50,
    hostVerified: host.isVerified ?? false,

    activity: draft.activity,
    activityCustom: draft.activityCustom || "",
    title: draft.title.trim(),
    description: draft.description.trim(),

    startTime: Timestamp.fromDate(start),
    endTime: Timestamp.fromDate(end),
    durationMinutes: draft.durationMinutes,

    locationName: draft.locationName.trim(),
    locationAddress: draft.locationAddress.trim(),
    city: draft.city,
    latitude: draft.latitude,
    longitude: draft.longitude,

    capacity: draft.capacity,
    costTotal: draft.costTotal,
    costPerPerson,

    requirements: draft.requirements,
    approvalMode: draft.approvalMode,
    visibility: draft.visibility,

    participants: [],
    participantDetails: [],
    spotsFilled: 0,

    pendingRequests: [],
    waitlist: [],

    chatId: `plan_${planId}`,

    status: "open",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Use a transaction to ensure consistency
  const { setDoc } = await import("firebase/firestore");
  await setDoc(newPlanRef, planDoc);

  // Also create the empty chat document
  const chatRef = doc(db, "chats", `plan_${planId}`);
  await setDoc(chatRef, {
    type: "plan",
    planId,
    participants: [host.uid],
    createdAt: serverTimestamp(),
  });

  return planId;
}

/**
 * Fetch a single Plan by ID.
 */
export async function getPlan(planId: string): Promise<Plan | null> {
  const ref = doc(db, "plans", planId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Plan;
}

/**
 * Discovery feed: fetch public plans in a city, sorted by start time.
 * Paginated with startAfter cursor.
 */
export async function fetchPlans({
  city,
  activityFilter,
  maxResults = 20,
  cursor,
}: {
  city?: string;
  activityFilter?: string | null;
  maxResults?: number;
  cursor?: QueryDocumentSnapshot | null;
}): Promise<{
  plans: Plan[];
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
}> {
  const constraints: any[] = [
    where("visibility", "==", "public"),
    where("status", "==", "open"),
    orderBy("startTime", "asc"),
  ];

  if (city) constraints.splice(1, 0, where("city", "==", city));
  if (activityFilter) constraints.splice(1, 0, where("activity", "==", activityFilter));
  if (cursor) constraints.push(startAfter(cursor));
  constraints.push(limit(maxResults));

  const q = query(collection(db, "plans"), ...constraints);
  const snap = await getDocs(q);

  const plans = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Plan));
  const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;

  return {
    plans,
    lastDoc,
    hasMore: snap.docs.length === maxResults,
  };
}

/**
 * Check if the current user is the host or participant of a plan.
 */
export function getPlanRole(
  plan: Plan,
  uid: string
): "host" | "participant" | "pending" | "waitlist" | "visitor" {
  if (plan.hostUid === uid) return "host";
  if (plan.participants.includes(uid)) return "participant";
  if (plan.pendingRequests.includes(uid)) return "pending";
  if (plan.waitlist.includes(uid)) return "waitlist";
  return "visitor";
}