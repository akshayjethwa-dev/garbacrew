import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useProfileStore } from "../../store/profileStore";

const RITUALS = [
  "Chai after",
  "Late-night food",
  "Photo dump",
  "Long drive",
  "Group call",
  "Just go home",
];

export default function StepVibe() {
  const { data, updateData } = useProfileStore();

  const vibeLabel = (score: number): string => {
    if (score <= 2) return "Deep introvert 🧘";
    if (score <= 4) return "Quiet observer 🌙";
    if (score <= 6) return "Balanced ⚖️";
    if (score <= 8) return "Social butterfly 🦋";
    return "Full-on extrovert 🎉";
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Your vibe</Text>
      <Text style={styles.subtitle}>
        This helps others know what energy you bring.
      </Text>

      <Text style={styles.sectionLabel}>Introvert ↔ Extrovert</Text>
      <View style={styles.vibeBox}>
        <Text style={styles.vibeLabel}>{vibeLabel(data.vibeScore)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={10}
          step={1}
          value={data.vibeScore}
          onValueChange={(value) => updateData({ vibeScore: value })}
          minimumTrackTintColor="#E91E63"
          maximumTrackTintColor="#E0E0E0"
          thumbTintColor="#E91E63"
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderEdge}>Introvert</Text>
          <Text style={styles.sliderEdge}>Extrovert</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>
        Favourite activity song (optional)
      </Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Chogada, Kamariya..."
        placeholderTextColor="#999"
        value={data.favoriteActivitySong}
        onChangeText={(text) => updateData({ favoriteActivitySong: text })}
        maxLength={60}
      />

      <Text style={styles.sectionLabel}>Post-activity ritual (optional)</Text>
      <View style={styles.chipRow}>
        {RITUALS.map((ritual) => {
          const selected = data.postActivityRitual === ritual;
          return (
            <View
              key={ritual}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text
                style={styles.chipText}
                onPress={() =>
                  updateData({
                    postActivityRitual: selected ? "" : ritual,
                  })
                }
              >
                {ritual}
              </Text>
            </View>
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
  vibeBox: {
    backgroundColor: "#FAFAFA",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
  },
  vibeLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#E91E63",
    textAlign: "center",
    marginBottom: 8,
  },
  slider: { width: "100%", height: 40 },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  sliderEdge: { fontSize: 12, color: "#999" },
  input: {
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
    color: "#333",
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    backgroundColor: "#FAFAFA",
  },
  chipSelected: { borderColor: "#E91E63", backgroundColor: "#FFF0F5" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#666" },
});