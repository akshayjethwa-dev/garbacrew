import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform,
} from "react-native";
import { usePlanCreateStore } from "../../store/planCreateStore";
import { DURATION_OPTIONS } from "../../constants/activities";

export default function Step2Details() {
  const { draft, updateDraft } = usePlanCreateStore();
  const [dateInput, setDateInput] = useState(
    draft.startDate ? draft.startDate.toISOString().slice(0, 10) : ""
  );

  const handleDateChange = (text: string) => {
    setDateInput(text);
    // Try parse YYYY-MM-DD
    const parsed = new Date(text);
    if (!isNaN(parsed.getTime())) {
      updateDraft({ startDate: parsed });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Details</Text>

      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Saturday morning cricket"
        placeholderTextColor="#999"
        value={draft.title}
        onChangeText={(t) => updateDraft({ title: t })}
        maxLength={60}
      />

      <Text style={styles.label}>Description (optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="What should people know?"
        placeholderTextColor="#999"
        value={draft.description}
        onChangeText={(t) => updateDraft({ description: t })}
        multiline
        maxLength={200}
        textAlignVertical="top"
      />

      <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        placeholder="2026-10-15"
        placeholderTextColor="#999"
        value={dateInput}
        onChangeText={handleDateChange}
        keyboardType={Platform.OS === "web" ? "default" : "numbers-and-punctuation"}
      />

      <Text style={styles.label}>Start Time (HH:MM)</Text>
      <TextInput
        style={styles.input}
        placeholder="18:30"
        placeholderTextColor="#999"
        value={draft.startTime}
        onChangeText={(t) => updateDraft({ startTime: t })}
        keyboardType="numbers-and-punctuation"
      />

      <Text style={styles.label}>Duration</Text>
      <View style={styles.chipRow}>
        {DURATION_OPTIONS.map((d) => (
          <TouchableOpacity
            key={d.value}
            style={[styles.chip, draft.durationMinutes === d.value && styles.chipActive]}
            onPress={() => updateDraft({ durationMinutes: d.value })}
          >
            <Text
              style={[
                styles.chipText,
                draft.durationMinutes === d.value && styles.chipTextActive,
              ]}
            >
              {d.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "800", color: "#1A1A1A", marginBottom: 24 },
  label: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 8, marginTop: 16 },
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
  textArea: { height: 100, paddingTop: 14 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    backgroundColor: "#FAFAFA",
  },
  chipActive: { borderColor: "#E91E63", backgroundColor: "#FFF0F5" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#666" },
  chipTextActive: { color: "#E91E63" },
});