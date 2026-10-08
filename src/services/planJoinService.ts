import { getFunctions, httpsCallable } from "firebase/functions";
import app from "../lib/firebase";
import { GarbaCrewUser } from "../types/user";

const functions = getFunctions(app, "asia-south1");

/**
 * Join a Plan.
 * - Free + auto-approve → instantly joined
 * - Free + manual      → creates a pending request
 */
export async function joinPlan(
  planId: string,
  message?: string
): Promise<{
  status: "joined" | "requested" | "waitlisted";
  warning?: string | null;
}> {
  const fn = httpsCallable(functions, "joinPlan");
  const result = await fn({ planId, message: message ?? "" });
  return result.data as {
    status: "joined" | "requested" | "waitlisted";
    warning?: string | null;
  };
}

/**
 * Leave a Plan (host or participant cancellation is a different flow;
 * this is for a participant dropping out).
 */
export async function leavePlan(
  planId: string
): Promise<{ refunded: boolean }> {
  const fn = httpsCallable(functions, "leavePlan");
  const result = await fn({ planId });
  return result.data as { refunded: boolean };
}

/**
 * Host approves a pending request.
 */
export async function approveJoinRequest(
  planId: string,
  requestUid: string
): Promise<void> {
  const fn = httpsCallable(functions, "approveJoinRequest");
  await fn({ planId, requestUid });
}

/**
 * Host declines a pending request.
 */
export async function declineJoinRequest(
  planId: string,
  requestUid: string,
  reason?: string
): Promise<void> {
  const fn = httpsCallable(functions, "declineJoinRequest");
  await fn({ planId, requestUid, reason: reason ?? "" });
}