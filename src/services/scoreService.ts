import { db, auth } from "../lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import app from "../lib/firebase";

const functions = getFunctions(app, "asia-south1");

export interface ScoreEvent {
  id: string;
  type: string;
  delta: number;
  createdAt: any;
  planId?: string;
}

/**
 * Fetch the last N score events for the current user.
 */
export async function getScoreHistory(
  uid: string,
  max: number = 20
): Promise<ScoreEvent[]> {
  const q = query(
    collection(db, "scoreEvents"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc"),
    limit(max)
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ScoreEvent));
}

/**
 * Call the stakeTrustBalance Cloud Function.
 */
export async function stakeTrust(planId: string, costPerPerson = 0) {
  const fn = httpsCallable(functions, "stakeTrustBalance");
  const result = await fn({ planId, costPerPerson });
  return result.data as {
    staked: number;
    balance: number | null;
    warning: string | null;
  };
}

/**
 * Call the releaseTrustBalance Cloud Function.
 */
export async function releaseTrust(
  planId: string,
  outcome: "showed_up" | "no_show" | "cancelled_early" | "cancelled_late"
) {
  const fn = httpsCallable(functions, "releaseTrustBalance");
  const result = await fn({ planId, outcome });
  return result.data as { delta: number; balance: number };
}