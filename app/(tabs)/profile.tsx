import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { auth } from "../../src/lib/firebase";
import { useAuth } from "../../src/context/AuthContext";
import { useProfileScore } from "../../src/hooks/useProfileScore";

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { score, tips } = useProfileScore(user);

  const performSignOut = async () => {
    try {
      console.log("🚪 Signing out...");
      await signOut(auth);
      console.log("✅ Signed out successfully");

      // Explicitly navigate to login — index.tsx won't run from a tab screen
      router.replace("/(auth)/login");
    } catch (error: any) {
      console.error("❌ Sign out failed:", error);
      Alert.alert("Error", error.message || "Failed to sign out.");
    }
  };

  const handleSignOut = () => {
    // On web, use window.confirm — Alert.alert callbacks don't fire reliably
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Are you sure you want to sign out?");
      if (confirmed) performSignOut();
      return;
    }

    // On native, Alert.alert works as expected
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: performSignOut,
      },
    ]);
  };

  if (!user) {
    // Safety fallback: if user is null but we're on the tab, send to login
    return (
      <View style={styles.fallbackContainer}>
        <TouchableOpacity
          style={styles.fallbackButton}
          onPress={() => router.replace("/(auth)/login")}
        >
          <Text style={styles.fallbackText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar */}
        <View style={styles.header}>
          {user.photoUrl ? (
            <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {user.name?.charAt(0)?.toUpperCase() || "?"}
              </Text>
            </View>
          )}
          <Text style={styles.name}>{user.name || "Your Name"}</Text>
          <Text style={styles.city}>{user.city || "Add your city"}</Text>

          {user.isVerified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✅ Verified</Text>
            </View>
          )}
        </View>

        {/* Profile Score */}
        <View style={styles.scoreSection}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNumber}>{score}</Text>
            <Text style={styles.scoreLabel}>Profile Score</Text>
          </View>

          {tips.length > 0 && (
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>Tips to improve</Text>
              {tips.map((tip, i) => (
                <Text key={i} style={styles.tipText}>
                  • {tip}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* Epic 2 placeholders */}
        <View style={styles.scoresRow}>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreCardLabel}>Host Score</Text>
            <Text style={styles.scoreCardValue}>{user.hostScore ?? 50}</Text>
          </View>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreCardLabel}>Guest Score</Text>
            <Text style={styles.scoreCardValue}>{user.guestScore ?? 50}</Text>
          </View>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreCardLabel}>Trust Balance</Text>
            <Text style={styles.scoreCardValue}>{user.trustBalance ?? 50}</Text>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  content: { paddingBottom: 40 },
  header: { alignItems: "center", paddingTop: 24, paddingBottom: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 16 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarInitial: { fontSize: 36, fontWeight: "700", color: "#999" },
  name: { fontSize: 24, fontWeight: "800", color: "#1A1A1A" },
  city: { fontSize: 15, color: "#666", marginTop: 4 },
  verifiedBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  verifiedText: { fontSize: 13, color: "#2E7D32", fontWeight: "600" },
  scoreSection: { paddingHorizontal: 24, marginBottom: 24 },
  scoreCircle: {
    alignSelf: "center",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    borderColor: "#E91E63",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  scoreNumber: { fontSize: 32, fontWeight: "800", color: "#E91E63" },
  scoreLabel: { fontSize: 12, color: "#999", marginTop: 2 },
  tipsContainer: {
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F57F17",
    marginBottom: 8,
  },
  tipText: { fontSize: 14, color: "#666", lineHeight: 22 },
  scoresRow: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 32,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: "#F9F9F9",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  scoreCardLabel: { fontSize: 12, color: "#999", marginBottom: 6 },
  scoreCardValue: { fontSize: 22, fontWeight: "800", color: "#333" },
  signOutButton: {
    marginHorizontal: 24,
    borderWidth: 1.5,
    borderColor: "#FF3B30",
    borderRadius: 14,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  signOutText: { fontSize: 16, fontWeight: "700", color: "#FF3B30" },
  fallbackContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  fallbackButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: "#E91E63",
    borderRadius: 12,
  },
  fallbackText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
});