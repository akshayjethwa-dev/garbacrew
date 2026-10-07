import { Timestamp } from "firebase/firestore";

// ─────────────────────────────────────────────────────────
// Transaction fees
// ─────────────────────────────────────────────────────────
export const PLATFORM_FEE_PERCENT = 5; // 5% of every paid Plan transaction

export type PayoutStatus =
  | "pending"
  | "processing"
  | "paid"
  | "failed"
  | "refunded";

export interface Payout {
  id: string;
  hostUid: string;
  planId: string;
  planTitle: string;
  grossAmount: number;       // total collected from participants
  platformFee: number;       // 5% cut
  netAmount: number;         // grossAmount - platformFee
  status: PayoutStatus;
  razorpayPaymentId: string | null;
  razorpayTransferId: string | null;
  failureReason?: string;
  retryCount: number;
  nextRetryAt?: Timestamp | any;
  createdAt: Timestamp | any;
  releasedAt?: Timestamp | any;
}

// ─────────────────────────────────────────────────────────
// Subscriptions
// ─────────────────────────────────────────────────────────
export type SubscriptionTier = "free" | "plus" | "pro";
export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "cancelled"
  | "expired"
  | "grace_period";

export interface Subscription {
  id: string;               // = uid (one subscription per user)
  uid: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  razorpaySubscriptionId: string | null;
  razorpayCustomerId: string | null;
  currentPeriodStart: Timestamp | any;
  currentPeriodEnd: Timestamp | any;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: Timestamp | any;
  gracePeriodEndsAt?: Timestamp | any;
  createdAt: Timestamp | any;
  updatedAt: Timestamp | any;
}

export const TIER_PRICING = {
  free: 0,
  plus: 149,   // ₹149/month
  pro: 349,    // ₹349/month
} as const;

export const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
  free: [
    "Unlimited joining of Plans",
    "2 hosted Plans per month",
    "1 Squad",
    "Standard discovery",
  ],
  plus: [
    "Everything in Free, plus:",
    "Priority approval in host queues",
    "Advanced filters (age, vibe, distance)",
    "See who viewed your profile",
    "Unlimited rewinds in Partner mode",
    "Spotlight badge on profile",
    "Ad-free experience",
    "Unlimited hosted Plans",
    "Up to 5 Squads",
  ],
  pro: [
    "Everything in Plus, plus:",
    "Advanced analytics dashboard",
    "Waitlist management",
    "Automated Plan reminders",
    "Bulk messaging (max 50 recipients)",
    "Custom branding on hosted Plans",
    "Co-admin roles in Squads",
    "CSV export of participants",
    "Unlimited Squads",
  ],
};

// ─────────────────────────────────────────────────────────
// Boosts
// ─────────────────────────────────────────────────────────
export type BoostType =
  | "spotlight"           // ₹49 — top of host approval queue for 24h
  | "plan_highlight"      // ₹99 — top of city feed for 24h
  | "reputation_shield";  // ₹199 — human review of one low rating

export interface Boost {
  id: string;
  uid: string;
  type: BoostType;
  pricePaid: number;
  razorpayPaymentId: string | null;
  targetId: string | null;   // planId if plan_highlight, ratingId if reputation_shield
  expiresAt: Timestamp | any;
  used: boolean;
  createdAt: Timestamp | any;
}

export const BOOST_PRICING: Record<BoostType, number> = {
  spotlight: 49,
  plan_highlight: 99,
  reputation_shield: 199,
};

export const BOOST_LABELS: Record<BoostType, { title: string; desc: string; emoji: string }> = {
  spotlight: {
    title: "Spotlight Boost",
    desc: "Top of every host's approval queue for 24 hours",
    emoji: "⭐",
  },
  plan_highlight: {
    title: "Plan Highlight",
    desc: "Your Plan appears at the top of the feed in your city for 24 hours",
    emoji: "🚀",
  },
  reputation_shield: {
    title: "Reputation Shield",
    desc: "Human review of one low rating within 48 hours",
    emoji: "🛡️",
  },
};

// ─────────────────────────────────────────────────────────
// Vendor Marketplace
// ─────────────────────────────────────────────────────────
export type VendorCategory =
  | "photographer"
  | "venue"
  | "catering"
  | "dj"
  | "makeup"
  | "transport"
  | "other";

export type VendorStatus = "pending" | "approved" | "rejected" | "suspended";

export interface Vendor {
  id: string;
  ownerUid: string;
  name: string;
  category: VendorCategory;
  city: string;
  description: string;
  portfolioUrls: string[];
  phone: string;
  panNumber: string;         // for tax
  priceFrom: number;         // ₹
  rating: number;
  reviewCount: number;
  bookingCount: number;
  commissionPercent: number; // 15-20%
  status: VendorStatus;
  adminNotes?: string;
  createdAt: Timestamp | any;
  approvedAt?: Timestamp | any;
}

// ─────────────────────────────────────────────────────────
// Local Partnerships
// ─────────────────────────────────────────────────────────
export type PartnershipStatus = "active" | "paused" | "ended";

export interface Partnership {
  id: string;
  venueName: string;
  city: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  monthlyRetainer: number;    // ₹5,000 - ₹25,000
  status: PartnershipStatus;
  sponsoredPlanIds: string[];
  startDate: Timestamp | any;
  endDate?: Timestamp | any;
  createdAt: Timestamp | any;
}