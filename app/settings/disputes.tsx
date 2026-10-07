import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { getMyDisputes } from "../../src/services/safetyService";
import { Dispute } from "../../src/types/safety";

function statusLabel(outcome: Dispute["outcome"]): {
  label: string;
  color: string;
} {
  switch (outcome) {
    case "pending":
      return { label: "Under review", color: "#F57F17" };
    case "full_refund":
      return { label: "Full refund", color: "#2E7D32" };
    case "partial_refund":
      return { label: "Partial refund", color: "#2E7D32" };
    case "released_to_host":
      return { label: "Released to host", color: "#666" };
    case "dismissed":
      return { label: "Dismissed", color: "#999" };
  }
}

export default function DisputesScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const list = await getMyDisputes(user.uid);
      setDisputes(list);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E91E63" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Disputes</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={disputes}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>⚖️</Text>
            <Text style={styles.emptyTitle}>No disputes</Text>
            <Text style={styles.emptyText}>
              File a dispute from any Plan detail screen if something goes wrong.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const status = statusLabel(item.outcome);
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.planTitle} numberOfLines={1}>
                  {item.planTitle}
                </Text>
                <View style={[styles.badge, { backgroundColor: status.color + "22" }]}>
                  <Text style={[styles.badgeText, { color: status.color }]}>
                    {status.label}
                  </Text>
                </View>
              </View>
              <Text style={styles.against}>
                Against: <Text style={styles.againstName}>{item.againstName}</Text>
              </Text>
              <Text style={styles.reason} numberOfLines={2}>
                {item.reason}
              </Text>
              <Text style={styles.amount}>₹{item.amount}</Text>
            </View>
          );
        }}
      />
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
  list: { padding: 16 },
  empty: { paddingTop: 80, alignItems: "center", paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#1A1A1A", marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#666", textAlign: "center", lineHeight: 20 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  planTitle: { fontSize: 15, fontWeight: "800", color: "#1A1A1A", flex: 1 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 8,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  against: { fontSize: 13, color: "#666", marginBottom: 6 },
  againstName: { fontWeight: "700", color: "#333" },
  reason: { fontSize: 13, color: "#444", lineHeight: 19, marginBottom: 10 },
  amount: { fontSize: 18, fontWeight: "800", color: "#E91E63" },
});