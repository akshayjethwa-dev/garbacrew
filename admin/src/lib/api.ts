import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

// ─── Diagnostic ───
export interface WhoamiResponse {
  authenticated: boolean;
  uid: string | null;
  email: string | null;
  emailVerified: boolean;
  provider: string | null;
  allowedEmails: string[];
  serverTime: string;
}

export async function adminWhoami(): Promise<WhoamiResponse> {
  const fn = httpsCallable(functions, "adminWhoami");
  return (await fn({})).data as WhoamiResponse;
}

// ─── Verification ───
export async function adminVerify() {
  const fn = httpsCallable(functions, "adminVerify");
  return (await fn({})).data as { ok: boolean; email: string };
}

// ─── Dashboard ───
export interface DashboardStats {
  users: number;
  plans: number;
  squads: number;
  reportsOpen: number;
  disputesOpen: number;
  vendorsPending: number;
  totalRevenue: number;
  newUsersThisWeek: number;
  recentActivity: {
    id: string;
    type: string;
    createdAt: number | null;
    [k: string]: any;
  }[];
}
export async function adminDashboard(): Promise<DashboardStats> {
  const fn = httpsCallable(functions, "adminDashboard");
  return (await fn({})).data as DashboardStats;
}

// ─── Generic CRUD ───
export async function adminList(
  collection: string,
  opts?: {
    limit?: number;
    cursor?: string | null;
    filters?: Record<string, any>;
  }
) {
  const fn = httpsCallable(functions, "adminList");
  return (await fn({ collection, ...opts })).data as {
    items: any[];
    nextCursor: string | null;
  };
}

export async function adminUpsert(
  collection: string,
  data: Record<string, any>,
  docId?: string
) {
  const fn = httpsCallable(functions, "adminUpsert");
  return (await fn({ collection, docId, data })).data as { id: string };
}

export async function adminDelete(collection: string, docId: string) {
  const fn = httpsCallable(functions, "adminDelete");
  return (await fn({ collection, docId })).data as { ok: boolean };
}

// ─── Reports / Disputes / Users ───
export async function adminResolveReport(params: {
  reportId: string;
  outcome:
    | "resolved_dismissed"
    | "resolved_warning"
    | "resolved_refund"
    | "resolved_ban";
  moderatorNotes?: string;
  issueStrike?: boolean;
}) {
  const fn = httpsCallable(functions, "adminResolveReport");
  return (await fn(params)).data;
}

export async function adminResolveDispute(params: {
  disputeId: string;
  outcome:
    | "full_refund"
    | "partial_refund"
    | "released_to_host"
    | "dismissed";
  moderatorNotes?: string;
}) {
  const fn = httpsCallable(functions, "adminResolveDispute");
  return (await fn(params)).data;
}

export async function adminUserAction(params: {
  uid: string;
  action:
    | "ban"
    | "unban"
    | "suspend"
    | "unsuspend"
    | "adjustScore"
    | "makeAdmin";
  payload?: any;
}) {
  const fn = httpsCallable(functions, "adminUserAction");
  return (await fn(params)).data;
}