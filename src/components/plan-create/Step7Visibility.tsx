import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { usePlanCreateStore } from "../../store/planCreateStore";

const OPTIONS = [
  {
    value: "public" as const,
    icon: "🌍",
    title: "Public",
    desc: "Anyone in the city can discover and join.",
  },
  {
    value: "squad_only" as const,
    icon: "👥",
    title: "Squad only",
    desc: "Only members of your Squads can see and join.",
  },
  {
    value: "private" as const,
    icon: "🔐",
    title: "Private (invite link)",
    desc: "Only people you invite can access.",
  },
];

export default function Step7Visibility() {
  const { draft, updateDraft } = usePlanCreateStore();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Who can see this?</Text>

      <View style={styles.list}>
        {OPTIONS.map((opt) => {
          const selected = draft.visibility === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.card, selected && styles.cardActive]}
              onPress={() => updateDraft({ visibility: opt.value })}
            >
              <Text style={styles.cardIcon}>{opt.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, selected && styles.cardTitleActive]}>
                  {opt.title}
                </Text>
                <Text style={styles.cardDesc}>{opt.desc}</Text>
              </View>
              <View style={[styles.radio, selected && styles.radioActive]}>
                {selected && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "800", color: "#1A1A1A", marginBottom: 24 },
  list: { gap: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    backgroundColor: "#FAFAFA",
  },
  cardActive: { borderColor: "#E91E63", backgroundColor: "#FFF0F5" },
  cardIcon: { fontSize: 26, marginRight: 14 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#333" },
  cardTitleActive: { color: "#E91E63" },
  cardDesc: { fontSize: 12, color: "#999", marginTop: 3, lineHeight: 16 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#CCC",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  radioActive: { borderColor: "#E91E63" },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E91E63",
  },
});