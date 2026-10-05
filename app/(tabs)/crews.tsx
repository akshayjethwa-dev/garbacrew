import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";

export default function CrewsScreen() {
  const { user, loading } = useAuth();

  // Show a loader while auth is still resolving
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E91E63" />
      </View>
    );
  }

  // If auth resolved but no user (shouldn't happen here), still guard
  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.greeting}>Hey {firstName} 👋</Text>
        <Text style={styles.subtitle}>
          Discover Plans and crews near you.
        </Text>

        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.emptyTitle}>You're all set!</Text>
          <Text style={styles.emptyText}>
            Profile complete. The Discover feed will show Plans and Squads
            here once Epic 3 is built.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Coming next</Text>
          <Text style={styles.infoItem}>• Browse Plans near you</Text>
          <Text style={styles.infoItem}>• Filter by activity & vibe</Text>
          <Text style={styles.infoItem}>• Join crews with one tap</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  content: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  greeting: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  subtitle: { fontSize: 15, color: "#666", marginBottom: 32 },
  emptyBox: {
    backgroundColor: "#FFF0F5",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#F8BBD0",
    marginBottom: 24,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#E91E63",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },
  infoItem: {
    fontSize: 14,
    color: "#666",
    lineHeight: 24,
  },
});