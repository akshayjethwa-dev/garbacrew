import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { createSquad } from "../../src/services/squadService";
import { EMPTY_SQUAD_DRAFT, DAY_NAMES } from "../../src/types/squad";
import { ACTIVITIES, CITIES } from "../../src/constants/activities";

export default function CreateSquadScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [draft, setDraft] = useState({ ...EMPTY_SQUAD_DRAFT, city: user?.city ?? "" });
  const [saving, setSaving] = useState(false);
  const [showCityList, setShowCityList] = useState(false);
  const [citySearch, setCitySearch] = useState("");

  const update = (partial: Partial<typeof draft>) =>
    setDraft((d) => ({ ...d, ...partial }));

  const filteredCities = CITIES.filter((c) =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  );

  const validate = (): boolean => {
    if (!draft.name.trim()) {
      Alert.alert("Name required", "Give your Squad a name.");
      return false;
    }
    if (!draft.activity) {
      Alert.alert("Activity required", "Pick the main activity for this Squad.");
      return false;
    }
    if (draft.activity === "custom" && !draft.activityCustom.trim()) {
      Alert.alert("Describe the activity", "Say what your Squad does.");
      return false;
    }
    if (!draft.city) {
      Alert.alert("City required", "Pick the city your Squad is based in.");
      return false;
    }
    if (draft.recurringEnabled && draft.recurringDayOfWeek === null) {
      Alert.alert("Pick a day", "Choose the day your Squad meets.");
      return false;
    }
    if (
      draft.recurringEnabled &&
      !/^\d{2}:\d{2}$/.test(draft.recurringTime)
    ) {
      Alert.alert("Time format", "Enter time in HH:MM (e.g., 18:30).");
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!user) return;
    if (!validate()) return;

    setSaving(true);
    try {
      const squadId = await createSquad(user, draft);
      router.replace({ pathname: "/squad/[id]", params: { id: squadId } });
    } catch (e: any) {
      Alert.alert("Could not create Squad", e.message ?? "Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Squad</Text>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>Squad name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Sunday Cricket Crew"
            placeholderTextColor="#999"
            value={draft.name}
            onChangeText={(t) => update({ name: t })}
            maxLength={40}
          />

          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What's your Squad about?"
            placeholderTextColor="#999"
            value={draft.description}
            onChangeText={(t) => update({ description: t })}
            multiline
            maxLength={200}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Activity</Text>
          <View style={styles.activityGrid}>
            {ACTIVITIES.map((a) => {
              const selected = draft.activity === a.value;
              return (
                <TouchableOpacity
                  key={a.value}
                  style={[styles.activityCard, selected && styles.activityCardActive]}
                  onPress={() => update({ activity: a.value })}
                >
                  <Text style={styles.activityEmoji}>{a.emoji}</Text>
                  <Text
                    style={[
                      styles.activityLabel,
                      selected && styles.activityLabelActive,
                    ]}
                  >
                    {a.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {draft.activity === "custom" && (
            <>
              <Text style={styles.label}>Describe your activity</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Board game nights"
                placeholderTextColor="#999"
                value={draft.activityCustom}
                onChangeText={(t) => update({ activityCustom: t })}
                maxLength={30}
              />
            </>
          )}

          <Text style={styles.label}>City</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowCityList(!showCityList)}
          >
            <Text style={draft.city ? styles.inputText : styles.placeholderText}>
              {draft.city || "Select city"}
            </Text>
          </TouchableOpacity>

          {showCityList && (
            <View style={styles.dropdown}>
              <TextInput
                style={styles.search}
                placeholder="Search city..."
                value={citySearch}
                onChangeText={setCitySearch}
                autoFocus
              />
              {filteredCities.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={styles.cityItem}
                  onPress={() => {
                    update({ city: c });
                    setShowCityList(false);
                    setCitySearch("");
                  }}
                >
                  <Text style={styles.cityText}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Recurring pattern</Text>
          <Text style={styles.sectionDesc}>
            Set a recurring schedule so Plans auto-generate for your Squad.
          </Text>

          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => update({ recurringEnabled: !draft.recurringEnabled })}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>Enable recurring</Text>
              <Text style={styles.toggleDesc}>
                Auto-create Plans on a fixed day/time
              </Text>
            </View>
            <View
              style={[styles.switch, draft.recurringEnabled && styles.switchOn]}
            >
              <View
                style={[styles.knob, draft.recurringEnabled && styles.knobOn]}
              />
            </View>
          </TouchableOpacity>

          {draft.recurringEnabled && (
            <>
              <Text style={styles.label}>Day of week</Text>
              <View style={styles.dayRow}>
                {DAY_NAMES.map((d, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.dayChip,
                      draft.recurringDayOfWeek === i && styles.dayChipActive,
                    ]}
                    onPress={() => update({ recurringDayOfWeek: i })}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        draft.recurringDayOfWeek === i && styles.dayTextActive,
                      ]}
                    >
                      {d.slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Time (HH:MM)</Text>
              <TextInput
                style={styles.input}
                placeholder="18:30"
                placeholderTextColor="#999"
                value={draft.recurringTime}
                onChangeText={(t) => update({ recurringTime: t })}
                keyboardType="numbers-and-punctuation"
              />
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.createBtn, saving && { opacity: 0.6 }]}
            onPress={handleCreate}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.createText}>Create Squad</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  closeText: { fontSize: 20, color: "#666", fontWeight: "600" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#1A1A1A" },
  scroll: { padding: 24, paddingBottom: 40 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
    color: "#333",
    justifyContent: "center",
  },
  inputText: { fontSize: 16, color: "#333" },
  placeholderText: { fontSize: 16, color: "#999" },
  textArea: { height: 100, paddingTop: 14 },
  activityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  activityCard: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    backgroundColor: "#FAFAFA",
    justifyContent: "center",
    alignItems: "center",
  },
  activityCardActive: { borderColor: "#E91E63", backgroundColor: "#FFF0F5" },
  activityEmoji: { fontSize: 26 },
  activityLabel: { fontSize: 11, fontWeight: "600", color: "#666", marginTop: 4 },
  activityLabelActive: { color: "#E91E63" },
  dropdown: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    maxHeight: 180,
    marginTop: 4,
  },
  search: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    fontSize: 15,
  },
  cityItem: { paddingHorizontal: 16, paddingVertical: 12 },
  cityText: { fontSize: 15, color: "#333" },
  divider: { height: 1, backgroundColor: "#F0F0F0", marginVertical: 24 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#1A1A1A" },
  sectionDesc: { fontSize: 13, color: "#666", marginTop: 4 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 12,
  },
  toggleLabel: { fontSize: 15, fontWeight: "600", color: "#333" },
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
  knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#FFF" },
  knobOn: { alignSelf: "flex-end" },
  dayRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    backgroundColor: "#FAFAFA",
  },
  dayChipActive: { borderColor: "#E91E63", backgroundColor: "#FFF0F5" },
  dayText: { fontSize: 12, fontWeight: "700", color: "#666" },
  dayTextActive: { color: "#E91E63" },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    backgroundColor: "#FFF",
  },
  createBtn: {
    height: 54,
    backgroundColor: "#E91E63",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  createText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});