import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useProfileStore } from "../../store/profileStore";

const GROUP_SIZES = [
  { value: 2, label: "1-on-1", desc: "Small & personal" },
  { value: 4, label: "Small crew", desc: "4 people" },
  { value: 6, label: "Medium crew", desc: "6 people" },
  { value: 10, label: "Big crew", desc: "10 people" },
  { value: 20, label: "Party", desc: "20+ people" },
  { value: -1, label: "No preference", desc: "Any size works" },
];

const LOOKING_FOR = [
  { value: "friend", label: "Friends", emoji: "🤝" },
  { value: "partner", label: "Partner", emoji: "💕" },
  { value: "crew", label: "Crew", emoji: "🎉" },
  { value: "all", label: "All of it", emoji: "✨" },
];

export default function StepGroupPref() {
  const { data, updateData } = useProfileStore();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Group preferences</Text>
      <Text style={styles.subtitle}>
        What kind of crew are you looking for?
      </Text>

      <Text style={styles.sectionLabel}>Preferred group size</Text>
      <View style={styles.grid}>
        {GROUP_SIZES.map((size) => {
          const selected = data.groupSizePreference === size.value;
          return (
            <TouchableOpacity
              key={size.value}
              style={[styles.sizeCard, selected && styles.sizeCardSelected]}
              onPress={() =>
                updateData({ groupSizePreference: size.value })
              }
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.sizeLabel,
                  selected && styles.sizeLabelSelected,
                ]}
              >
                {size.label}
              </Text>
              <Text style={styles.sizeDesc}>{size.desc}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>I'm looking for</Text>
      <View style={styles.lookingRow}>
        {LOOKING_FOR.map((item) => {
          const selected = data.lookingFor === item.value;
          return (
            <TouchableOpacity
              key={item.value}
              style={[styles.lookingCard, selected && styles.lookingCardSelected]}
              onPress={() => updateData({ lookingFor: item.value as any })}
              activeOpacity={0.7}
            >
              <Text style={styles.lookingEmoji}>{item.emoji}</Text>
              <Text
                style={[
                  styles.lookingLabel,
                  selected && styles.lookingLabelSelected,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
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
  subtitle: { fontSize: 14, color: "#666", marginBottom: 24 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginTop: 20,
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  sizeCard: {
    width: "47%",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    backgroundColor: "#FAFAFA",
  },
  sizeCardSelected: { borderColor: "#E91E63", backgroundColor: "#FFF0F5" },
  sizeLabel: { fontSize: 15, fontWeight: "700", color: "#333" },
  sizeLabelSelected: { color: "#E91E63" },
  sizeDesc: { fontSize: 12, color: "#999", marginTop: 3 },
  lookingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  lookingCard: {
    width: "47%",
    aspectRatio: 1.5,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    backgroundColor: "#FAFAFA",
    justifyContent: "center",
    alignItems: "center",
  },
  lookingCardSelected: {
    borderColor: "#E91E63",
    backgroundColor: "#FFF0F5",
  },
  lookingEmoji: { fontSize: 30, marginBottom: 6 },
  lookingLabel: { fontSize: 14, fontWeight: "700", color: "#666" },
  lookingLabelSelected: { color: "#E91E63" },
});