import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { useProfileScore } from "../../src/hooks/useProfileScore";

export default function ProfileScreen() {
  const { user } = useAuth();
  const { score, tips } = useProfileScore(user);

  if (!user) return null;

  return (
    <ScrollView style={styles.container}>
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

      {/* Profile Score Ring */}
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

      {/* Scores (Epic 2 placeholders) */}
      <View style={styles.scoresRow}>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreCardLabel}>Host Score</Text>
          <Text style={styles.scoreCardValue}>{user.hostScore}</Text>
        </View>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreCardLabel}>Guest Score</Text>
          <Text style={styles.scoreCardValue}>{user.guestScore}</Text>
        </View>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreCardLabel}>Trust Balance</Text>
          <Text style={styles.scoreCardValue}>{user.trustBalance}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  header: { alignItems: "center", paddingTop: 60, paddingBottom: 24 },
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
  tipsTitle: { fontSize: 15, fontWeight: "700", color: "#F57F17", marginBottom: 8 },
  tipText: { fontSize: 14, color: "#666", lineHeight: 22 },
  scoresRow: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 40,
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
});