import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useProfileStore } from "../../store/profileStore";

const LANGUAGES = [
  { value: "hindi", label: "Hindi", emoji: "🇮🇳" },
  { value: "english", label: "English", emoji: "🇬🇧" },
  { value: "gujarati", label: "Gujarati", emoji: "🪔" },
  { value: "marathi", label: "Marathi", emoji: "🎭" },
  { value: "tamil", label: "Tamil", emoji: "🌺" },
  { value: "telugu", label: "Telugu", emoji: "🎬" },
  { value: "kannada", label: "Kannada", emoji: "🌾" },
  { value: "bengali", label: "Bengali", emoji: "🐟" },
  { value: "punjabi", label: "Punjabi", emoji: "🥁" },
  { value: "malayalam", label: "Malayalam", emoji: "🌴" },
  { value: "urdu", label: "Urdu", emoji: "🕌" },
  { value: "other", label: "Other", emoji: "🌍" },
];

export default function StepLanguages() {
  const { data, updateData } = useProfileStore();

  const toggle = (value: string) => {
    const current = data.languages;
    const updated = current.includes(value)
      ? current.filter((l) => l !== value)
      : [...current, value];
    updateData({ languages: updated });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Languages you speak</Text>
      <Text style={styles.subtitle}>
        Select all that apply. This helps you find crews who speak your language.
      </Text>

      <View style={styles.grid}>
        {LANGUAGES.map((lang) => {
          const selected = data.languages.includes(lang.value);
          return (
            <TouchableOpacity
              key={lang.value}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => toggle(lang.value)}
              activeOpacity={0.7}
            >
              <Text style={styles.chipEmoji}>{lang.emoji}</Text>
              <Text
                style={[styles.chipText, selected && styles.chipTextSelected]}
              >
                {lang.label}
              </Text>
              {selected && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.counter}>
        {data.languages.length} selected
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
    gap: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    backgroundColor: "#FAFAFA",
  },
  chipSelected: {
    borderColor: "#E91E63",
    backgroundColor: "#FFF0F5",
  },
  chipEmoji: { fontSize: 16, marginRight: 6 },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  chipTextSelected: { color: "#E91E63" },
  checkmark: {
    marginLeft: 6,
    color: "#E91E63",
    fontSize: 14,
    fontWeight: "800",
  },
  counter: {
    marginTop: 24,
    fontSize: 13,
    color: "#999",
    textAlign: "center",
  },
});