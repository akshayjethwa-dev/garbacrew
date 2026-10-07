import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from "../lib/firebase";
import app from "../lib/firebase";
import {
  Boost,
  BoostType,
  BOOST_PRICING,
  Payout,
  Subscription,
  SubscriptionTier,
  TIER_PRICING,
  Vendor,
  VendorCategory,
  Partnership,
} from "../types/monetization";

const functions = getFunctions(app, "asia-south1");

// ─────────────────────────────────────────────────────────
// Payouts (Story 8.1)
// ─────────────────────────────────────────────────────────
export async function getMyPayouts(uid: string): Promise<Payout[]> {
  const q = query(
    collection(db, "payouts"),
    where("hostUid", "==", uid),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Payout));
}

export async function getPayoutForPlan(planId: string): Promise<Payout | null> {
  const snap = await getDocs(
    query(collection(db, "payouts"), where("planId", "==", planId), limit(1))
  );
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Payout;
}

// ─────────────────────────────────────────────────────────
// Subscriptions (Story 8.2)
// ─────────────────────────────────────────────────────────
export async function getMySubscription(
  uid: string
): Promise<Subscription | null> {
  const snap = await getDoc(doc(db, "subscriptions", uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Subscription;
}

export async function createSubscriptionCheckout(
  tier: SubscriptionTier
): Promise<{
  subscriptionId: string;
  shortUrl: string;
  keyId: string;
}> {
  if (tier === "free") throw new Error("Free tier doesn't need checkout");

  const fn = httpsCallable(functions, "createSubscriptionCheckout");
  const result = await fn({ tier });
  return result.data as {
    subscriptionId: string;
    shortUrl: string;
    keyId: string;
  };
}

export async function cancelSubscription(): Promise<void> {
  const fn = httpsCallable(functions, "cancelSubscription");
  await fn({});
}

// ─────────────────────────────────────────────────────────
// Boosts (Story 8.3)
// ─────────────────────────────────────────────────────────
export async function getMyBoosts(uid: string): Promise<Boost[]> {
  const q = query(
    collection(db, "boosts"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc"),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Boost));
}

export async function createBoostCheckout(
  type: BoostType,
  targetId?: string
): Promise<{
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}> {
  const fn = httpsCallable(functions, "createBoostCheckout");
  const result = await fn({ type, targetId: targetId ?? null });
  return result.data as {
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
  };
}

export async function confirmBoostPayment(
  orderId: string,
  paymentId: string,
  signature: string
): Promise<void> {
  const fn = httpsCallable(functions, "confirmBoostPayment");
  await fn({ orderId, paymentId, signature });
}

export function getBoostPrice(type: BoostType): number {
  return BOOST_PRICING[type];
}

export function getTierPrice(tier: SubscriptionTier): number {
  return TIER_PRICING[tier];
}

// ─────────────────────────────────────────────────────────
// Vendors (Story 8.4 — scaffolding)
// ─────────────────────────────────────────────────────────
export async function submitVendorApplication(data: {
  name: string;
  category: VendorCategory;
  city: string;
  description: string;
  portfolioUrls: string[];
  phone: string;
  panNumber: string;
  priceFrom: number;
  ownerUid: string;
}): Promise<string> {
  const vendorRef = doc(collection(db, "vendors"));
  await setDoc(vendorRef, {
    ...data,
    rating: 0,
    reviewCount: 0,
    bookingCount: 0,
    commissionPercent: 18,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  return vendorRef.id;
}

export async function getApprovedVendors(
  city: string,
  category?: VendorCategory
): Promise<Vendor[]> {
  const constraints: any[] = [
    where("city", "==", city),
    where("status", "==", "approved"),
    orderBy("rating", "desc"),
    limit(30),
  ];
  if (category) constraints.splice(1, 0, where("category", "==", category));

  const q = query(collection(db, "vendors"), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Vendor));
}

// ─────────────────────────────────────────────────────────
// Partnerships (Story 8.5 — scaffolding)
// ─────────────────────────────────────────────────────────
export async function getActivePartnerships(city: string): Promise<Partnership[]> {
  const q = query(
    collection(db, "partnerships"),
    where("city", "==", city),
    where("status", "==", "active")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Partnership));
}