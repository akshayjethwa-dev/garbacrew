import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useProfileStore } from "../../store/profileStore";

const ACTIVITIES = [
  { value: "cricket", label: "Cricket", emoji: "🏏" },
  { value: "trek", label: "Trek", emoji: "🥾" },
  { value: "garba", label: "Garba", emoji: "💃" },
  { value: "movies", label: "Movies", emoji: "🎬" },
  { value: "food", label: "Food", emoji: "🍽️" },
  { value: "gaming", label: "Gaming", emoji: "🎮" },
  { value: "fitness", label: "Fitness", emoji: "💪" },
  { value: "study", label: "Study", emoji: "📚" },
  { value: "music", label: "Music", emoji: "🎵" },
  { value: "travel", label: "Travel", emoji: "✈️" },
  { value: "photography", label: "Photography", emoji: "📸" },
  { value: "dance", label: "Dance", emoji: "🕺" },
];

export default function StepActivities() {
  const { data, updateData } = useProfileStore();

  const toggle = (value: string) => {
    const current = data.activities;
    const updated = current.includes(value)
      ? current.filter((a) => a !== value)
      : [...current, value];
    updateData({ activities: updated });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>What do you love doing?</Text>
      <Text style={styles.subtitle}>
        Pick at least 2. We'll show you Plans and crews that match your vibe.
      </Text>

      <View style={styles.grid}>
        {ACTIVITIES.map((act) => {
          const selected = data.activities.includes(act.value);
          return (
            <TouchableOpacity
              key={act.value}
              style={[styles.card, selected && styles.cardSelected]}
              onPress={() => toggle(act.value)}
              activeOpacity={0.7}
            >
              <Text style={styles.cardEmoji}>{act.emoji}</Text>
              <Text
                style={[styles.cardText, selected && styles.cardTextSelected]}
              >
                {act.label}
              </Text>
              {selected && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.counter}>
        {data.activities.length} selected
        {data.activities.length === 0 && " — pick at least 2"}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
    lineHeight: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: "47%",
    aspectRatio: 1.2,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    backgroundColor: "#FAFAFA",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  cardSelected: {
    borderColor: "#E91E63",
    backgroundColor: "#FFF0F5",
  },
  cardEmoji: { fontSize: 36, marginBottom: 8 },
  cardText: { fontSize: 15, fontWeight: "600", color: "#666" },
  cardTextSelected: { color: "#E91E63" },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E91E63",
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: { color: "#FFF", fontSize: 13, fontWeight: "800" },
  counter: {
    marginTop: 24,
    fontSize: 13,
    color: "#999",
    textAlign: "center",
  },
});