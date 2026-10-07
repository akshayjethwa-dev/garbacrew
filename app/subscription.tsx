import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useAuth } from "../src/context/AuthContext";
import {
  getMySubscription,
  createSubscriptionCheckout,
  cancelSubscription,
  getTierPrice,
} from "../src/services/monetizationService";
import {
  Subscription,
  SubscriptionTier,
  TIER_FEATURES,
} from "../src/types/monetization";

const TIERS: { tier: SubscriptionTier; label: string; emoji: string }[] = [
  { tier: "free", label: "Free", emoji: "🌱" },
  { tier: "plus", label: "Plus", emoji: "⭐" },
  { tier: "pro", label: "Pro", emoji: "👑" },
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<SubscriptionTier | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const sub = await getMySubscription(user.uid);
      setSubscription(sub);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (!user) return;
    if (tier === "free") return;

    setProcessing(tier);
    try {
      const { shortUrl, keyId } = await createSubscriptionCheckout(tier);

      // Open Razorpay checkout page in an in-app browser
      await WebBrowser.openBrowserAsync(shortUrl);

      // After close, assume success in staging — reload subscription
      // In production, wait for webhook + poll getMySubscription
      Alert.alert(
        "Payment processing",
        "Once Razorpay confirms your payment, your subscription will activate within 60 seconds.",
        [{ text: "OK", onPress: () => load() }]
      );
    } catch (e: any) {
      Alert.alert("Could not start checkout", e.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancel subscription?",
      "You'll keep Plus/Pro features until the end of your current billing period.",
      [
        { text: "Keep subscription", style: "cancel" },
        {
          text: "Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelSubscription();
              Alert.alert("Cancelled", "Your plan won't renew.");
              await load();
            } catch (e: any) {
              Alert.alert("Error", e.message);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E91E63" />
      </View>
    );
  }

  const currentTier = subscription?.tier ?? "free";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {currentTier !== "free" && (
          <View style={styles.currentBanner}>
            <Text style={styles.currentLabel}>Current plan</Text>
            <Text style={styles.currentTier}>
              {currentTier === "plus" ? "Plus" : "Pro"}
            </Text>
            {subscription?.currentPeriodEnd?.toDate && (
              <Text style={styles.currentDate}>
                Renews on{" "}
                {subscription.currentPeriodEnd.toDate().toLocaleDateString()}
              </Text>
            )}
          </View>
        )}

        {TIERS.map(({ tier, label, emoji }) => {
          const price = getTierPrice(tier);
          const isCurrent = currentTier === tier;
          const features = TIER_FEATURES[tier];

          return (
            <View
              key={tier}
              style={[
                styles.tierCard,
                isCurrent && styles.tierCardCurrent,
                tier === "pro" && styles.tierCardPro,
              ]}
            >
              <View style={styles.tierHeader}>
                <Text style={styles.tierEmoji}>{emoji}</Text>
                <Text style={styles.tierName}>{label}</Text>
                {isCurrent && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>Current</Text>
                  </View>
                )}
              </View>

              <Text style={styles.tierPrice}>
                {price === 0 ? "Free" : `₹${price}`}
                {price > 0 && <Text style={styles.tierPriceUnit}>/month</Text>}
              </Text>

              <View style={styles.featureList}>
                {features.map((f, i) => (
                  <Text key={i} style={styles.featureItem}>
                    • {f}
                  </Text>
                ))}
              </View>

              {tier === "free" ? (
                <View style={styles.disabledBtn}>
                  <Text style={styles.disabledBtnText}>
                    {isCurrent ? "You're on this plan" : "Free forever"}
                  </Text>
                </View>
              ) : isCurrent ? (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelBtnText}>Cancel subscription</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.upgradeBtn,
                    processing === tier && { opacity: 0.6 },
                  ]}
                  onPress={() => handleUpgrade(tier)}
                  disabled={!!processing}
                >
                  {processing === tier ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.upgradeBtnText}>
                      Upgrade to {label}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        <Text style={styles.legalText}>
          Subscriptions auto-renew. Cancel anytime from your Wallet screen.
          Payments processed via Razorpay.
        </Text>

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
  currentBanner: {
    backgroundColor: "#FFF0F5",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#F8BBD0",
  },
  currentLabel: { fontSize: 12, color: "#999" },
  currentTier: {
    fontSize: 22,
    fontWeight: "800",
    color: "#E91E63",
    marginVertical: 4,
  },
  currentDate: { fontSize: 12, color: "#666" },
  tierCard: {
    backgroundColor: "#FAFAFA",
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#EEE",
  },
  tierCardCurrent: { borderColor: "#E91E63", backgroundColor: "#FFF0F5" },
  tierCardPro: { borderColor: "#E91E63" },
  tierHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  tierEmoji: { fontSize: 28, marginRight: 10 },
  tierName: { fontSize: 22, fontWeight: "800", color: "#1A1A1A", flex: 1 },
  currentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "#E91E63",
  },
  currentBadgeText: { color: "#FFF", fontSize: 11, fontWeight: "800" },
  tierPrice: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 16,
  },
  tierPriceUnit: { fontSize: 14, fontWeight: "500", color: "#999" },
  featureList: { marginBottom: 18 },
  featureItem: { fontSize: 13, color: "#555", lineHeight: 22 },
  upgradeBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#E91E63",
    alignItems: "center",
  },
  upgradeBtnText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  cancelBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#FF3B30",
    alignItems: "center",
  },
  cancelBtnText: { color: "#FF3B30", fontWeight: "700", fontSize: 14 },
  disabledBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
  },
  disabledBtnText: { color: "#999", fontWeight: "700", fontSize: 14 },
  legalText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 20,
    lineHeight: 18,
  },
});