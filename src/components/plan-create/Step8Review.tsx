import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { usePlanCreateStore } from "../../store/planCreateStore";
import { getActivityMeta } from "../../constants/activities";

export default function Step8Review() {
  const { draft } = usePlanCreateStore();
  const actMeta = draft.activity ? getActivityMeta(draft.activity) : null;

  const startDate = draft.startDate
    ? draft.startDate.toLocaleDateString()
    : "Not set";

  const costLabel =
    draft.costTotal > 0
      ? `₹${draft.costTotal} total (${
          draft.capacity > 0
            ? "₹" + Math.round(draft.costTotal / draft.capacity) + " per person"
            : "split among participants"
        })`
      : "Free";

  const capacityLabel =
    draft.capacity === 0 ? "Unlimited" : `${draft.capacity} people`;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Review</Text>
      <Text style={styles.subtitle}>Make sure everything looks good</Text>

      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>{actMeta?.emoji ?? "🎉"}</Text>
        <Text style={styles.heroTitle}>
          {draft.title || "Untitled Plan"}
        </Text>
        {draft.description ? (
          <Text style={styles.heroDesc}>{draft.description}</Text>
        ) : null}
      </View>

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Activity</Text>
        <Text style={styles.rowValue}>
          {draft.activity === "custom"
            ? draft.activityCustom || "Custom"
            : actMeta?.label ?? "—"}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.rowLabel}>When</Text>
        <Text style={styles.rowValue}>
          {startDate} at {draft.startTime || "—"}
          {"\n"}
          <Text style={styles.sub}>
            {draft.durationMinutes} min
          </Text>
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Where</Text>
        <Text style={styles.rowValue}>
          {draft.locationName || "—"}
          {draft.city ? `\n${draft.city}` : ""}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Capacity</Text>
        <Text style={styles.rowValue}>{capacityLabel}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Cost</Text>
        <Text style={styles.rowValue}>{costLabel}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Approval</Text>
        <Text style={styles.rowValue}>{draft.approvalMode}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Visibility</Text>
        <Text style={styles.rowValue}>{draft.visibility}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "800", color: "#1A1A1A", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 24 },
  hero: {
    backgroundColor: "#FFF0F5",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: "#F8BBD0",
  },
  heroEmoji: { fontSize: 52, marginBottom: 12 },
  heroTitle: { fontSize: 20, fontWeight: "800", color: "#E91E63", textAlign: "center" },
  heroDesc: { fontSize: 14, color: "#666", textAlign: "center", marginTop: 8 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  rowLabel: { fontSize: 14, color: "#999", fontWeight: "600" },
  rowValue: { fontSize: 14, color: "#333", fontWeight: "600", textAlign: "right", flex: 1, marginLeft: 16 },
  sub: { fontSize: 12, color: "#999", fontWeight: "400" },
});