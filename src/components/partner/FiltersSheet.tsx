import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
} from "react-native";
import { usePartnerFiltersStore } from "../../store/partnerFiltersStore";
import { PARTNER_VIBES } from "../../constants/partnerVibes";
import { ACTIVITIES, CITIES } from "../../constants/activities";
import { DEFAULT_PARTNER_FILTERS, PartnerGender } from "../../types/partner";

const GENDERS: { value: PartnerGender; label: string }[] = [
  { value: "any", label: "Anyone" },
  { value: "male", label: "Men" },
  { value: "female", label: "Women" },
  { value: "other", label: "Other" },
];

export default function FiltersSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { filters, setFilters, resetFilters } = usePartnerFiltersStore();
  const [local, setLocal] = useState({ ...filters });

  const update = (partial: Partial<typeof local>) =>
    setLocal((s) => ({ ...s, ...partial }));

  const apply = () => {
    setFilters(local);
    onClose();
  };

  const reset = () => {
    setLocal({ ...DEFAULT_PARTNER_FILTERS });
    resetFilters();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.headerClose}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Filters</Text>
            <TouchableOpacity onPress={reset}>
              <Text style={styles.headerReset}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scroll}>
            {/* Age range */}
            <Text style={styles.label}>Age range</Text>
            <View style={styles.ageRow}>
              <View style={styles.ageField}>
                <Text style={styles.ageHint}>Min</Text>
                <TextInput
                  style={styles.ageInput}
                  keyboardType="number-pad"
                  value={String(local.ageMin)}
                  onChangeText={(t) => {
                    const n = parseInt(t.replace(/[^0-9]/g, ""), 10);
                    update({ ageMin: isNaN(n) ? 18 : Math.max(18, Math.min(80, n)) });
                  }}
                />
              </View>
              <View style={styles.ageField}>
                <Text style={styles.ageHint}>Max</Text>
                <TextInput
                  style={styles.ageInput}
                  keyboardType="number-pad"
                  value={String(local.ageMax)}
                  onChangeText={(t) => {
                    const n = parseInt(t.replace(/[^0-9]/g, ""), 10);
                    update({ ageMax: isNaN(n) ? 45 : Math.max(18, Math.min(80, n)) });
                  }}
                />
              </View>
            </View>

            {/* Gender */}
            <Text style={styles.label}>Show me</Text>
            <View style={styles.chipRow}>
              {GENDERS.map((g) => {
                const active = local.gender === g.value;
                return (
                  <TouchableOpacity
                    key={g.value}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => update({ gender: g.value })}
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* City */}
            <Text style={styles.label}>City</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                <TouchableOpacity
                  style={[styles.chip, !local.city && styles.chipActive]}
                  onPress={() => update({ city: null })}
                >
                  <Text
                    style={[styles.chipText, !local.city && styles.chipTextActive]}
                  >
                    Any city
                  </Text>
                </TouchableOpacity>
                {CITIES.map((c) => {
                  const active = local.city === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => update({ city: c })}
                    >
                      <Text
                        style={[styles.chipText, active && styles.chipTextActive]}
                      >
                        {c}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Vibe */}
            <Text style={styles.label}>Vibe</Text>
            <View style={styles.chipRow}>
              <TouchableOpacity
                style={[styles.chip, !local.vibe && styles.chipActive]}
                onPress={() => update({ vibe: null })}
              >
                <Text
                  style={[styles.chipText, !local.vibe && styles.chipTextActive]}
                >
                  Any vibe
                </Text>
              </TouchableOpacity>
              {PARTNER_VIBES.map((v) => {
                const active = local.vibe === v.value;
                return (
                  <TouchableOpacity
                    key={v.value}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => update({ vibe: v.value })}
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {v.emoji} {v.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Activities */}
            <Text style={styles.label}>Shared activities</Text>
            <View style={styles.chipRow}>
              {ACTIVITIES.filter((a) => a.value !== "custom").map((a) => {
                const active = local.activities.includes(a.value);
                return (
                  <TouchableOpacity
                    key={a.value}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() =>
                      update({
                        activities: active
                          ? local.activities.filter((x) => x !== a.value)
                          : [...local.activities, a.value],
                      })
                    }
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {a.emoji} {a.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Verified only */}
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>Verified only</Text>
                <Text style={styles.switchDesc}>
                  Only show users with a verified selfie
                </Text>
              </View>
              <Switch
                value={local.verifiedOnly}
                onValueChange={(v) => update({ verifiedOnly: v })}
                trackColor={{ true: "#E91E63" }}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.applyBtn} onPress={apply}>
              <Text style={styles.applyText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerClose: { fontSize: 20, color: "#666", fontWeight: "600" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: "#1A1A1A" },
  headerReset: { fontSize: 14, color: "#E91E63", fontWeight: "700" },
  scroll: { padding: 20, paddingBottom: 40 },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
  },
  ageRow: { flexDirection: "row", gap: 12 },
  ageField: { flex: 1 },
  ageHint: { fontSize: 12, color: "#999", marginBottom: 4 },
  ageInput: {
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 15,
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
  chipActive: { borderColor: "#E91E63", backgroundColor: "#FFF0F5" },
  chipText: { fontSize: 13, color: "#666", fontWeight: "600" },
  chipTextActive: { color: "#E91E63" },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 12,
  },
  switchLabel: { fontSize: 15, fontWeight: "600", color: "#333" },
  switchDesc: { fontSize: 12, color: "#999", marginTop: 2 },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  applyBtn: {
    height: 54,
    backgroundColor: "#E91E63",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  applyText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});