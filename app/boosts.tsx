import React, { useState } from "react";
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
import { useRouter } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import {
  createBoostCheckout,
  confirmBoostPayment,
} from "../src/services/monetizationService";
import {
  BoostType,
  BOOST_LABELS,
  BOOST_PRICING,
} from "../src/types/monetization";

const BOOSTS: BoostType[] = ["spotlight", "plan_highlight", "reputation_shield"];

export default function BoostsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [processing, setProcessing] = useState<BoostType | null>(null);

  const handleBuy = async (type: BoostType) => {
    if (!user) return;

    setProcessing(type);
    try {
      const order = await createBoostCheckout(type);

      // In production, open Razorpay checkout and get real signature.
      // For staging, simulate success.
      Alert.alert(
        "Confirm purchase",
        `Buy ${BOOST_LABELS[type].title} for ₹${BOOST_PRICING[type]}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Buy",
            onPress: async () => {
              try {
                // Mock signature in staging
                await confirmBoostPayment(
                  order.orderId,
                  `pay_mock_${Date.now()}`,
                  "mock_signature"
                );
                Alert.alert(
                  "Boost activated! 🎉",
                  `${BOOST_LABELS[type].title} is now live for 24 hours.`
                );
              } catch (e: any) {
                Alert.alert("Payment confirmation failed", e.message);
              }
            },
          },
        ]
      );
    } catch (e: any) {
      Alert.alert("Could not start checkout", e.message);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Boosts</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>
          One-time purchases. No subscription required. Each boost lasts 24
          hours or until used.
        </Text>

        {BOOSTS.map((type) => {
          const meta = BOOST_LABELS[type];
          const price = BOOST_PRICING[type];
          const busy = processing === type;

          return (
            <View key={type} style={styles.card}>
              <View style={styles.cardIconWrap}>
                <Text style={styles.cardIcon}>{meta.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{meta.title}</Text>
                <Text style={styles.cardDesc}>{meta.desc}</Text>
                <Text style={styles.cardPrice}>₹{price}</Text>
              </View>
              <TouchableOpacity
                style={[styles.buyBtn, busy && { opacity: 0.6 }]}
                onPress={() => handleBuy(type)}
                disabled={!!processing}
              >
                {busy ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.buyBtnText}>Buy</Text>
                )}
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={styles.noteBox}>
          <Text style={styles.noteText}>
            💡 Boost your Plan with Highlight to reach the top of the feed in
            your city. Use Spotlight before a Plan fills up, or Reputation
            Shield to challenge an unfair low rating.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
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
  intro: {
    fontSize: 13,
    color: "#666",
    lineHeight: 20,
    marginBottom: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  cardIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFF0F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  cardIcon: { fontSize: 26 },
  cardTitle: { fontSize: 15, fontWeight: "800", color: "#1A1A1A" },
  cardDesc: { fontSize: 12, color: "#666", marginTop: 3, lineHeight: 17 },
  cardPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: "#E91E63",
    marginTop: 8,
  },
  buyBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: "#E91E63",
    borderRadius: 10,
    marginLeft: 12,
  },
  buyBtnText: { color: "#FFF", fontSize: 14, fontWeight: "700" },
  noteBox: {
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  noteText: { fontSize: 12, color: "#7A5C00", lineHeight: 19 },
});