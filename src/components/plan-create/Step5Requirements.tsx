import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from "react-native";
import { usePlanCreateStore } from "../../store/planCreateStore";
import { SkillLevel } from "../../types/plan";

const SKILL_LEVELS: { value: SkillLevel; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export default function Step5Requirements() {
  const { draft, updateDraft } = usePlanCreateStore();
  const req = draft.requirements;

  const updateReq = (partial: Partial<typeof req>) =>
    updateDraft({ requirements: { ...req, ...partial } });

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Requirements</Text>
      <Text style={styles.subtitle}>Optional filters for who can join</Text>

      <TouchableOpacity
        style={styles.toggleRow}
        onPress={() => updateReq({ verifiedOnly: !req.verifiedOnly })}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.toggleLabel}>Verified users only</Text>
          <Text style={styles.toggleDesc}>Only users with a verified selfie can join</Text>
        </View>
        <View style={[styles.switch, req.verifiedOnly && styles.switchOn]}>
          <View style={[styles.knob, req.verifiedOnly && styles.knobOn]} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.toggleRow}
        onPress={() => updateReq({ womenOnly: !req.womenOnly })}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.toggleLabel}>Women only</Text>
          <Text style={styles.toggleDesc}>Only women can join this Plan</Text>
        </View>
        <View style={[styles.switch, req.womenOnly && styles.switchOn]}>
          <View style={[styles.knob, req.womenOnly && styles.knobOn]} />
        </View>
      </TouchableOpacity>

      <Text style={styles.sectionLabel}>Minimum Guest Score</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 40 (leave empty for no minimum)"
        placeholderTextColor="#999"
        keyboardType="number-pad"
        value={req.minGuestScore?.toString() ?? ""}
        onChangeText={(t) => {
          const n = parseInt(t.replace(/[^0-9]/g, ""), 10);
          updateReq({ minGuestScore: isNaN(n) ? null : Math.min(n, 100) });
        }}
      />

      <Text style={styles.sectionLabel}>Skill level</Text>
      <View style={styles.chipRow}>
        {SKILL_LEVELS.map((s) => (
          <TouchableOpacity
            key={s.value}
            style={[styles.chip, req.skillLevel === s.value && styles.chipActive]}
            onPress={() =>
              updateReq({ skillLevel: req.skillLevel === s.value ? null : s.value })
            }
          >
            <Text
              style={[
                styles.chipText,
                req.skillLevel === s.value && styles.chipTextActive,
              ]}
            >
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "800", color: "#1A1A1A", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 24 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  toggleLabel: { fontSize: 16, fontWeight: "600", color: "#333" },
  toggleDesc: { fontSize: 12, color: "#999", marginTop: 2 },
  switch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E0E0E0",
    padding: 2,
    justifyContent: "center",
  },
  switchOn: { backgroundColor: "#E91E63" },
  knob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFF",
  },
  knobOn: { alignSelf: "flex-end" },
  sectionLabel: { fontSize: 14, fontWeight: "700", color: "#333", marginTop: 24, marginBottom: 12 },
  input: {
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    backgroundColor: "#FAFAFA",
  },
  chipActive: { borderColor: "#E91E63", backgroundColor: "#FFF0F5" },
  chipText: { fontSize: 14, fontWeight: "600", color: "#666" },
  chipTextActive: { color: "#E91E63" },
});