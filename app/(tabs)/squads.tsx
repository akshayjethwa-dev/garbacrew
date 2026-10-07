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
import { getMySquads } from "../../src/services/squadService";
import { Squad } from "../../src/types/squad";
import { getActivityMeta } from "../../src/constants/activities";

export default function SquadsScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      const list = await getMySquads(user.uid);
      setSquads(list);
    } catch (e: any) {
      console.warn(e);
      setError(e.message ?? "Could not load Squads");
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
        <Text style={styles.title}>Your Squads</Text>
        <Text style={styles.subtitle}>
          Persistent crews that play together
        </Text>
      </View>

      {error ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>⚠️</Text>
          <Text style={styles.emptyTitle}>Couldn't load Squads</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : squads.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>👥</Text>
          <Text style={styles.emptyTitle}>No Squads yet</Text>
          <Text style={styles.emptyText}>
            Form a Squad with your regular crew so you always have a home.
          </Text>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => router.push("/squad/create")}
          >
            <Text style={styles.createText}>+ Create Squad</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={squads}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#E91E63"
            />
          }
          renderItem={({ item }) => {
            const act = getActivityMeta(item.activity);
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() =>
                  router.push({ pathname: "/squad/[id]", params: { id: item.id } })
                }
                activeOpacity={0.85}
              >
                <View style={[styles.cardBanner, { backgroundColor: act.color + "22" }]}>
                  {item.coverImageUrl ? (
                    <Image
                      source={{ uri: item.coverImageUrl }}
                      style={styles.cardCover}
                    />
                  ) : (
                    <Text style={styles.cardEmoji}>{act.emoji}</Text>
                  )}
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.cardMeta}>
                    {act.label} · {item.city}
                  </Text>
                  <Text style={styles.cardMeta}>
                    {item.memberUids.length} member
                    {item.memberUids.length === 1 ? "" : "s"}
                    {item.recurring?.enabled
                      ? ` · Recurring ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][item.recurring.dayOfWeek ?? 0]}`
                      : ""}
                  </Text>
                  {item.adminUid === user?.uid && (
                    <View style={styles.adminBadge}>
                      <Text style={styles.adminText}>You're admin</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {squads.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push("/squad/create")}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: "800", color: "#1A1A1A" },
  subtitle: { fontSize: 14, color: "#666", marginTop: 4 },
  list: { paddingHorizontal: 24, paddingBottom: 80 },
  empty: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#1A1A1A", marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 24, lineHeight: 20 },
  createBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: "#E91E63",
    borderRadius: 12,
  },
  createText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E91E63",
  },
  retryText: { color: "#E91E63", fontWeight: "700" },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardBanner: {
    width: 92,
    justifyContent: "center",
    alignItems: "center",
  },
  cardCover: { width: 92, height: "100%" },
  cardEmoji: { fontSize: 40 },
  cardBody: { flex: 1, padding: 14 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#1A1A1A" },
  cardMeta: { fontSize: 12, color: "#666", marginTop: 3 },
  adminBadge: {
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: "#FFF0F5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  adminText: { fontSize: 11, color: "#E91E63", fontWeight: "700" },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E91E63",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabText: { color: "#FFF", fontSize: 32, fontWeight: "300", lineHeight: 34 },
});