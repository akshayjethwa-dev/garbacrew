import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import {
  getMyPayouts,
  getMySubscription,
  getMyBoosts,
} from "../src/services/monetizationService";
import {
  Payout,
  Subscription,
  Boost,
  TIER_FEATURES,
} from "../src/types/monetization";

export default function WalletScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [boosts, setBoosts] = useState<Boost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const [p, s, b] = await Promise.all([
        getMyPayouts(user.uid),
        getMySubscription(user.uid),
        getMyBoosts(user.uid),
      ]);
      setPayouts(p);
      setSubscription(s);
      setBoosts(b);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (user) load();
    }, [user, load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E91E63" />
      </View>
    );
  }

  const totalEarned = payouts
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.netAmount, 0);

  const pendingAmount = payouts
    .filter((p) => p.status === "pending" || p.status === "processing")
    .reduce((sum, p) => sum + p.netAmount, 0);

  const currentTier = subscription?.tier ?? "free";
  const currentTierLabel =
    currentTier === "free" ? "Free" : currentTier === "plus" ? "Plus" : "Pro";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#E91E63"
          />
        }
      >
        {/* Earnings summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total earned</Text>
          <Text style={styles.summaryAmount}>₹{totalEarned.toLocaleString()}</Text>
          {pendingAmount > 0 && (
            <Text style={styles.summaryPending}>
              ₹{pendingAmount.toLocaleString()} pending release
            </Text>
          )}
        </View>

        {/* Subscription card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Subscription</Text>
            <View
              style={[
                styles.tierBadge,
                currentTier === "pro" && styles.tierBadgePro,
                currentTier === "plus" && styles.tierBadgePlus,
              ]}
            >
              <Text style={styles.tierBadgeText}>{currentTierLabel}</Text>
            </View>
          </View>

          <Text style={styles.tierDescription}>
            {currentTier === "free"
              ? "Upgrade for priority approval, advanced filters, and more."
              : `Renews ${
                  subscription?.currentPeriodEnd?.toDate
                    ? subscription.currentPeriodEnd
                        .toDate()
                        .toLocaleDateString()
                    : "soon"
                }`}
          </Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push("/subscription" as any)}
          >
            <Text style={styles.primaryBtnText}>
              {currentTier === "free" ? "Upgrade plan" : "Manage subscription"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Boosts card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Boosts</Text>
            <Text style={styles.boostCount}>
              {boosts.filter((b) => new Date(b.expiresAt?.toDate?.() ?? 0) > new Date()).length} active
            </Text>
          </View>
          <Text style={styles.tierDescription}>
            Spotlight your profile, highlight a Plan, or shield a low rating.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push("/boosts" as any)}
          >
            <Text style={styles.primaryBtnText}>Browse boosts</Text>
          </TouchableOpacity>
        </View>

        {/* Payouts list */}
        <Text style={styles.sectionTitle}>Payout history</Text>
        {payouts.length === 0 ? (
          <Text style={styles.emptyText}>
            No payouts yet. Host a paid Plan to start earning.
          </Text>
        ) : (
          payouts.map((p) => (
            <View key={p.id} style={styles.payoutRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.payoutTitle} numberOfLines={1}>
                  {p.planTitle}
                </Text>
                <Text style={styles.payoutMeta}>
                  ₹{p.grossAmount} gross · ₹{p.platformFee} fee
                </Text>
              </View>
              <View style={styles.payoutRight}>
                <Text style={styles.payoutAmount}>₹{p.netAmount}</Text>
                <Text
                  style={[
                    styles.payoutStatus,
                    p.status === "paid" && styles.statusPaid,
                    p.status === "pending" && styles.statusPending,
                    p.status === "failed" && styles.statusFailed,
                  ]}
                >
                  {p.status}
                </Text>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backText: { fontSize: 22, color: "#666", fontWeight: "600", width: 24 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#1A1A1A" },
  scroll: { padding: 20 },
  summaryCard: {
    backgroundColor: "#E91E63",
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  summaryLabel: { fontSize: 14, color: "rgba(255,255,255,0.8)" },
  summaryAmount: {
    fontSize: 40,
    fontWeight: "800",
    color: "#FFF",
    marginVertical: 6,
  },
  summaryPending: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: "#F9F9F9",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A1A1A",
    marginTop: 8,
    marginBottom: 8,
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "#E0E0E0",
  },
  tierBadgePlus: { backgroundColor: "#4CAF50" },
  tierBadgePro: { backgroundColor: "#E91E63" },
  tierBadgeText: { fontSize: 12, fontWeight: "800", color: "#FFF" },
  tierDescription: { fontSize: 13, color: "#666", marginBottom: 14 },
  primaryBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#E91E63",
    alignItems: "center",
  },
  primaryBtnText: { fontSize: 14, fontWeight: "700", color: "#E91E63" },
  boostCount: { fontSize: 13, color: "#999", fontWeight: "600" },
  emptyText: { fontSize: 14, color: "#999", textAlign: "center", marginTop: 12 },
  payoutRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  payoutTitle: { fontSize: 14, fontWeight: "700", color: "#333" },
  payoutMeta: { fontSize: 12, color: "#999", marginTop: 3 },
  payoutRight: { alignItems: "flex-end" },
  payoutAmount: { fontSize: 16, fontWeight: "800", color: "#1A1A1A" },
  payoutStatus: { fontSize: 11, fontWeight: "700", marginTop: 3 },
  statusPaid: { color: "#2E7D32" },
  statusPending: { color: "#F57F17" },
  statusFailed: { color: "#FF3B30" },
});