import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { usePlanCreateStore } from "../../store/planCreateStore";

const MODES = [
  {
    value: "auto" as const,
    icon: "⚡",
    title: "Instant join",
    desc: "Anyone can join immediately. Best for casual meetups.",
  },
  {
    value: "manual" as const,
    icon: "✅",
    title: "Approve each request",
    desc: "You review each request and approve manually.",
  },
  {
    value: "paid_auto" as const,
    icon: "💳",
    title: "Pay & join instantly",
    desc: "Users pay and are added immediately. For paid Plans.",
  },
  {
    value: "paid_manual" as const,
    icon: "🔒",
    title: "Approve, then pay",
    desc: "You approve first, then the user pays. Most controlled.",
  },
];

export default function Step6Approval() {
  const { draft, updateDraft } = usePlanCreateStore();
  const isPaid = draft.costTotal > 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Approval mode</Text>
      <Text style={styles.subtitle}>
        {isPaid
          ? "Your Plan is paid — pick how users join after paying."
          : "Your Plan is free — pick how users join."}
      </Text>

      <View style={styles.list}>
        {MODES.map((m) => {
          const isPaidMode = m.value.startsWith("paid");
          const disabled = isPaidMode !== isPaid;
          const selected = draft.approvalMode === m.value;

          return (
            <TouchableOpacity
              key={m.value}
              style={[
                styles.card,
                selected && styles.cardActive,
                disabled && styles.cardDisabled,
              ]}
              onPress={() => !disabled && updateDraft({ approvalMode: m.value })}
              disabled={disabled}
            >
              <Text style={styles.cardIcon}>{m.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, selected && styles.cardTitleActive]}>
                  {m.title}
                </Text>
                <Text style={styles.cardDesc}>{m.desc}</Text>
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
  title: { fontSize: 24, fontWeight: "800", color: "#1A1A1A", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 24 },
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
  cardDisabled: { opacity: 0.4 },
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