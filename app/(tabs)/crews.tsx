import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { QueryDocumentSnapshot } from "firebase/firestore";
import { useAuth } from "../../src/context/AuthContext";
import { fetchPlans } from "../../src/services/planService";
import { Plan } from "../../src/types/plan";
import PlanCard from "../../src/components/plan/PlanCard";
import FilterChips from "../../src/components/plan/FilterChips";

export default function CrewsScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activityFilter, setActivityFilter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadFirst = useCallback(async () => {
    if (!user?.city) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPlans({
        city: user.city,
        activityFilter,
        maxResults: 20,
      });
      setPlans(result.plans);
      setCursor(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (e: any) {
      console.warn(e);
      setError(e.message ?? "Could not load Plans");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.city, activityFilter]);

  useEffect(() => {
    if (!authLoading && user) loadFirst();
  }, [authLoading, user, activityFilter]);

  // Reload when screen is focused (so newly created Plans appear)
  useFocusEffect(
    useCallback(() => {
      if (user) loadFirst();
    }, [user, loadFirst])
  );

  const loadMore = async () => {
    if (!hasMore || loadingMore || !cursor || !user?.city) return;
    setLoadingMore(true);
    try {
      const result = await fetchPlans({
        city: user.city,
        activityFilter,
        maxResults: 20,
        cursor,
      });
      setPlans((prev) => [...prev, ...result.plans]);
      setCursor(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoadingMore(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFirst();
  };

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E91E63" />
      </View>
    );
  }

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hey {firstName} 👋</Text>
        <Text style={styles.subtitle}>
          {user?.city ? `Plans near ${user.city}` : "Discover Plans and crews"}
        </Text>
      </View>

      <FilterChips selected={activityFilter} onSelect={setActivityFilter} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E91E63" />
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>⚠️</Text>
          <Text style={styles.emptyTitle}>Couldn't load Plans</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadFirst}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <PlanCard plan={item} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#E91E63"
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🎉</Text>
              <Text style={styles.emptyTitle}>No Plans nearby</Text>
              <Text style={styles.emptyText}>
                Be the first to create one in {user?.city ?? "your city"}!
              </Text>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => router.push("/plan/create")}
              >
                <Text style={styles.createText}>+ Create Plan</Text>
              </TouchableOpacity>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={{ marginVertical: 20 }} color="#E91E63" />
            ) : null
          }
        />
      )}

      {/* Floating create button */}
      {!loading && plans.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push("/plan/create")}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 4 },
  greeting: { fontSize: 26, fontWeight: "800", color: "#1A1A1A" },
  subtitle: { fontSize: 14, color: "#666", marginTop: 4 },
  listContent: { paddingHorizontal: 24, paddingBottom: 80 },
  emptyContainer: {
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