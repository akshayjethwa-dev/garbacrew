// Score deltas — single source of truth for the entire platform
export const SCORE = {
  // Host Score deltas
  HOST_PLAN_COMPLETED: +15,
  HOST_LATE_CANCEL: -10,      // <24h
  HOST_NO_SHOW: -30,
  HOST_LATE_RESPONSE: -2,     // >24h to respond to requests
  HOST_5_STAR: +5,

  // Guest Score deltas
  GUEST_PLAN_COMPLETED: +10,
  GUEST_NO_SHOW: -20,
  GUEST_LATE_CANCEL: -10,     // <24h
  GUEST_MID_CANCEL: -5,       // 3-7 days
  GUEST_5_STAR: +2,

  // Trust Balance deltas
  TRUST_JOIN_STAKE: -5,       // held in escrow
  TRUST_SHOW_UP: +10,         // 5 escrow + 5 earned
  TRUST_NO_SHOW: 0,           // escrow burned (the -5 already applied)
  TRUST_LATE_CANCEL: -3,      // <24h penalty on top of escrow
} as const;

export const SCORE_MIN = 0;
export const SCORE_MAX = 100;
export const SCORE_START = 50;

export const TRUST_MIN = 0;
export const TRUST_MAX = 100;
export const TRUST_START = 50;
export const TRUST_BLOCK_JOIN = 5;
export const TRUST_WARN_JOIN = 20;

// Access control tiers
export const TRUST_TIERS = {
  FULL_PRO: { min: 85, label: "Full + Pro eligible" },
  FULL: { min: 70, label: "Full access" },
  STANDARD: { min: 50, label: "Standard access" },
  RESTRICTED_LARGE: { min: 40, label: "Cannot join 5+ person Plans" },
  RESTRICTED_HOST: { min: 30, label: "Cannot create Plans" },
  RESTRICTED_VERIFIED_ONLY: { min: 15, label: "Can only join verified hosts" },
  SUSPENDED: { min: 0, label: "Suspended 30 days" },
} as const;

export function clampScore(value: number): number {
  return Math.max(SCORE_MIN, Math.min(SCORE_MAX, value));
}

export function clampTrust(value: number): number {
  return Math.max(TRUST_MIN, Math.min(TRUST_MAX, value));
}

export function getTrustTier(balance: number): keyof typeof TRUST_TIERS {
  if (balance >= 85) return "FULL_PRO";
  if (balance >= 70) return "FULL";
  if (balance >= 50) return "STANDARD";
  if (balance >= 40) return "RESTRICTED_LARGE";
  if (balance >= 30) return "RESTRICTED_HOST";
  if (balance >= 15) return "RESTRICTED_VERIFIED_ONLY";
  return "SUSPENDED";
}