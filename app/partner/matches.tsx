import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { getMyMatches } from "../../src/services/partnerService";
import { PartnerMatch } from "../../src/types/partner";

function timeAgo(ts: any): string {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export default function MatchesScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [matches, setMatches] = useState<PartnerMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const list = await getMyMatches(user.uid);
      setMatches(list);
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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Matches</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={matches}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#E91E63"
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>💘</Text>
            <Text style={styles.emptyTitle}>No matches yet</Text>
            <Text style={styles.emptyText}>
              Keep swiping to find your activity partner.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const expired = item.status === "expired";
          return (
            <TouchableOpacity
              style={[styles.row, expired && { opacity: 0.5 }]}
              onPress={() =>
                router.push({
                  pathname: "/partner/chat/[id]" as any,
                  params: { id: item.id },
                })
              }
              activeOpacity={0.7}
              disabled={expired}
            >
              {item.otherPhotoUrl ? (
                <Image
                  source={{ uri: item.otherPhotoUrl }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitial}>
                    {item.otherName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{item.otherName}</Text>
                  {item.superLike && <Text style={styles.superTag}>⭐</Text>}
                </View>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {item.lastMessage
                    ? item.lastMessage
                    : expired
                    ? "Match expired"
                    : item.firstMessageBy
                    ? "Say hi"
                    : "New match — send the first message"}
                </Text>
              </View>
              <View style={styles.meta}>
                <Text style={styles.time}>
                  {timeAgo(item.lastMessageAt ?? item.matchedAt)}
                </Text>
                {item.status === "active" && <View style={styles.activeDot} />}
              </View>
            </TouchableOpacity>
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
  title: { fontSize: 18, fontWeight: "800", color: "#1A1A1A" },
  list: { padding: 12 },
  empty: { paddingTop: 80, alignItems: "center" },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  emptyText: { fontSize: 14, color: "#666", textAlign: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 12 },
  avatarFallback: {
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: { fontSize: 22, fontWeight: "700", color: "#999" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { fontSize: 15, fontWeight: "700", color: "#1A1A1A" },
  superTag: { fontSize: 12 },
  subtitle: { fontSize: 13, color: "#666", marginTop: 3 },
  meta: { alignItems: "flex-end" },
  time: { fontSize: 11, color: "#999" },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E91E63",
    marginTop: 6,
  },
});