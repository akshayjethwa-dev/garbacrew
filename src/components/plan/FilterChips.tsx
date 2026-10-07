import React from "react";
import { ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import { ACTIVITIES } from "../../constants/activities";

interface Props {
  selected: string | null;
  onSelect: (value: string | null) => void;
}

export default function FilterChips({ selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      <TouchableOpacity
        style={[styles.chip, !selected && styles.chipActive]}
        onPress={() => onSelect(null)}
      >
        <Text style={[styles.text, !selected && styles.textActive]}>All</Text>
      </TouchableOpacity>
      {ACTIVITIES.map((a) => {
        const active = selected === a.value;
        return (
          <TouchableOpacity
            key={a.value}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(active ? null : a.value)}
          >
            <Text style={styles.emoji}>{a.emoji}</Text>
            <Text style={[styles.text, active && styles.textActive]}>
              {a.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingHorizontal: 24, paddingVertical: 12 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    backgroundColor: "#FAFAFA",
  },
  chipActive: { borderColor: "#E91E63", backgroundColor: "#FFF0F5" },
  emoji: { fontSize: 14, marginRight: 6 },
  text: { fontSize: 13, fontWeight: "600", color: "#666" },
  textActive: { color: "#E91E63" },
});