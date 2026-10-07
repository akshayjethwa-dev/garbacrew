import { GarbaCrewUser } from "../types/user";

export type AccessLevel =
  | "full_pro"
  | "full"
  | "standard"
  | "restricted_large"
  | "restricted_host"
  | "restricted_verified_only"
  | "suspended";

export interface AccessResult {
  allowed: boolean;
  level: AccessLevel;
  reason?: string;
}

export function checkTrustAccess(
  user: GarbaCrewUser | null,
  action: "join_plan" | "create_plan",
  context?: { planSize?: number; hostVerified?: boolean }
): AccessResult {
  if (!user) {
    return { allowed: false, level: "suspended", reason: "Not signed in" };
  }

  const balance = user.trustBalance ?? 50;

  // Determine tier
  let level: AccessLevel;
  if (balance >= 85) level = "full_pro";
  else if (balance >= 70) level = "full";
  else if (balance >= 50) level = "standard";
  else if (balance >= 40) level = "restricted_large";
  else if (balance >= 30) level = "restricted_host";
  else if (balance >= 15) level = "restricted_verified_only";
  else level = "suspended";

  // Apply tier rules
  if (action === "create_plan") {
    if (balance < 30) {
      return {
        allowed: false,
        level,
        reason: "Trust Balance too low to create Plans (minimum 30).",
      };
    }
    return { allowed: true, level };
  }

  if (action === "join_plan") {
    if (balance < 5) {
      return {
        allowed: false,
        level,
        reason: "Trust Balance too low to join any Plan (minimum 5).",
      };
    }

    if (balance < 40 && context?.planSize && context.planSize >= 5) {
      return {
        allowed: false,
        level,
        reason: "Trust Balance too low to join Plans with 5+ people.",
      };
    }

    if (balance < 30 && !context?.hostVerified) {
      return {
        allowed: false,
        level,
        reason: "You can only join Plans hosted by verified users right now.",
      };
    }

    return { allowed: true, level };
  }

  return { allowed: true, level };
}

export function getTierLabel(level: AccessLevel): string {
  const labels: Record<AccessLevel, string> = {
    full_pro: "Full Access + Pro",
    full: "Full Access",
    standard: "Standard Access",
    restricted_large: "Cannot join 5+ person Plans",
    restricted_host: "Cannot create Plans",
    restricted_verified_only: "Verified hosts only",
    suspended: "Suspended",
  };
  return labels[level];
}