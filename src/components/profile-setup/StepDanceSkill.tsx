import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from "react-native";
import { useProfileStore } from "../../store/profileStore";

const SKILL_LEVELS = [
  { value: "beginner", label: "Beginner", desc: "Just starting out", emoji: "🌱" },
  { value: "intermediate", label: "Intermediate", desc: "Know the basics", emoji: "🌟" },
  { value: "advanced", label: "Advanced", desc: "Can lead a circle", emoji: "🔥" },
  { value: "expert", label: "Expert", desc: "Garba pro / years of practice", emoji: "👑" },
];

const DANCE_STYLES = [
  "Garba",
  "Dandiya Raas",
  "Bhangra",
  "Bollywood",
  "Contemporary",
  "Hip-Hop",
  "Classical",
  "Salsa",
];

export default function StepDanceSkill() {
  const { data, updateData } = useProfileStore();

  const toggleStyle = (style: string) => {
    const current = data.preferredStyles;
    const updated = current.includes(style)
      ? current.filter((s) => s !== style)
      : [...current, style];
    updateData({ preferredStyles: updated });
  };

  const handleYears = (text: string) => {
    const years = parseInt(text.replace(/[^0-9]/g, ""), 10);
    updateData({ yearsAttendingNavratri: isNaN(years) ? null : Math.min(years, 50) });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Your dance skill</Text>
      <Text style={styles.subtitle}>
        Helps hosts match you with the right crew.
      </Text>

      <Text style={styles.sectionLabel}>Skill Level</Text>
      <View style={styles.skillList}>
        {SKILL_LEVELS.map((level) => {
          const selected = data.danceSkill === level.value;
          return (
            <TouchableOpacity
              key={level.value}
              style={[styles.skillCard, selected && styles.skillCardSelected]}
              onPress={() => updateData({ danceSkill: level.value as any })}
              activeOpacity={0.7}
            >
              <Text style={styles.skillEmoji}>{level.emoji}</Text>
              <View style={styles.skillTextContainer}>
                <Text
                  style={[
                    styles.skillLabel,
                    selected && styles.skillLabelSelected,
                  ]}
                >
                  {level.label}
                </Text>
                <Text style={styles.skillDesc}>{level.desc}</Text>
              </View>
              <View
                style={[styles.radio, selected && styles.radioSelected]}
              >
                {selected && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>Preferred Styles (optional)</Text>
      <View style={styles.chipRow}>
        {DANCE_STYLES.map((style) => {
          const selected = data.preferredStyles.includes(style);
          return (
            <TouchableOpacity
              key={style}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => toggleStyle(style)}
            >
              <Text
                style={[styles.chipText, selected && styles.chipTextSelected]}
              >
                {style}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>Years attending Navratri</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 3"
        placeholderTextColor="#999"
        keyboardType="number-pad"
        value={data.yearsAttendingNavratri?.toString() || ""}
        onChangeText={handleYears}
        maxLength={2}
      />
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
  skillList: { gap: 10 },
  skillCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    backgroundColor: "#FAFAFA",
  },
  skillCardSelected: {
    borderColor: "#E91E63",
    backgroundColor: "#FFF0F5",
  },
  skillEmoji: { fontSize: 28, marginRight: 14 },
  skillTextContainer: { flex: 1 },
  skillLabel: { fontSize: 16, fontWeight: "700", color: "#333" },
  skillLabelSelected: { color: "#E91E63" },
  skillDesc: { fontSize: 13, color: "#999", marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#CCC",
    justifyContent: "center",
    alignItems: "center",
  },
  radioSelected: { borderColor: "#E91E63" },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E91E63",
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
  chipTextSelected: { color: "#E91E63" },
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
});