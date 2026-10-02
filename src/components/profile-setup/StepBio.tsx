import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useProfileStore } from "../../store/profileStore";

const MAX_BIO = 150;

export default function StepBio() {
  const { data, updateData } = useProfileStore();

  const remaining = MAX_BIO - data.bio.length;
  const isOverLimit = remaining < 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.title}>One last thing…</Text>
        <Text style={styles.subtitle}>
          Write a short bio to introduce yourself. Keep it light and fun ✨
        </Text>

        <TextInput
          style={[styles.textArea, isOverLimit && styles.textAreaError]}
          placeholder="e.g., Garba lover 🪔, always up for late-night chai, learning new steps every Navratri!"
          placeholderTextColor="#999"
          value={data.bio}
          onChangeText={(text) =>
            updateData({ bio: text.slice(0, MAX_BIO) })
          }
          multiline
          maxLength={MAX_BIO}
          textAlignVertical="top"
        />

        <View style={styles.counterRow}>
          <Text style={styles.hint}>
            {remaining > 0
              ? `${remaining} characters left`
              : remaining === 0
              ? "Perfect length!"
              : "Too long"}
          </Text>
          <Text
            style={[
              styles.counter,
              remaining < 20 && styles.counterWarning,
            ]}
          >
            {data.bio.length}/{MAX_BIO}
          </Text>
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>🎉 You're all set!</Text>
          <Text style={styles.summaryText}>
            Tap "Complete Profile" below. You can always edit this later from
            your profile settings.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  content: { paddingHorizontal: 24, paddingBottom: 40, flex: 1 },
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
  textArea: {
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 14,
    minHeight: 140,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 15,
    backgroundColor: "#FAFAFA",
    color: "#333",
    lineHeight: 22,
  },
  textAreaError: { borderColor: "#FF3B30" },
  counterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  hint: { fontSize: 12, color: "#999" },
  counter: { fontSize: 12, color: "#999" },
  counterWarning: { color: "#FF3B30", fontWeight: "700" },
  summaryBox: {
    marginTop: 32,
    padding: 20,
    backgroundColor: "#FFF0F5",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#F8BBD0",
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#E91E63",
    marginBottom: 8,
  },
  summaryText: { fontSize: 14, color: "#666", lineHeight: 20 },
});