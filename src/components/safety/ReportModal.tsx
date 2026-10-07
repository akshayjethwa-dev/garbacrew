import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../context/AuthContext";
import { submitReport } from "../../services/safetyService";
import { REPORT_REASONS } from "../../constants/reportReasons";
import { ReportReason, ReportTargetType } from "../../types/safety";

interface Props {
  visible: boolean;
  targetType: ReportTargetType;
  targetId: string;
  targetOwnerUid?: string;
  targetLabel?: string;
  onClose: () => void;
}

export default function ReportModal({
  visible,
  targetType,
  targetId,
  targetOwnerUid,
  targetLabel,
  onClose,
}: Props) {
  const { user } = useAuth();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [evidence, setEvidence] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setReason(null);
    setDetails("");
    setEvidence([]);
  };

  const pickEvidence = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: 3,
    });
    if (!result.canceled) {
      setEvidence((prev) =>
        [...prev, ...result.assets.map((a) => a.uri)].slice(0, 3)
      );
    }
  };

  const handleSubmit = async () => {
    if (!user || !reason) {
      Alert.alert("Pick a reason", "Tell us what happened.");
      return;
    }

    setSubmitting(true);
    try {
      await submitReport({
        me: user,
        targetType,
        targetId,
        targetOwnerUid,
        reason,
        details,
        evidenceFiles: evidence,
      });
      Alert.alert(
        "Report submitted",
        "Our moderators will review this within 24 hours."
      );
      reset();
      onClose();
    } catch (e: any) {
      Alert.alert("Could not submit", e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Report</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={styles.scroll}>
            {targetLabel ? (
              <Text style={styles.targetText}>
                Reporting: <Text style={styles.targetBold}>{targetLabel}</Text>
              </Text>
            ) : null}

            <Text style={styles.label}>What's the issue?</Text>
            {REPORT_REASONS.map((r) => {
              const active = reason === r.value;
              return (
                <TouchableOpacity
                  key={r.value}
                  style={[styles.reasonRow, active && styles.reasonRowActive]}
                  onPress={() => setReason(r.value)}
                >
                  <Text style={styles.reasonEmoji}>{r.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.reasonLabel,
                        active && styles.reasonLabelActive,
                      ]}
                    >
                      {r.label}
                    </Text>
                    <Text style={styles.reasonDesc}>{r.description}</Text>
                  </View>
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}

            <Text style={styles.label}>Details (optional)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Tell us more about what happened"
              placeholderTextColor="#999"
              value={details}
              onChangeText={setDetails}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />

            <Text style={styles.label}>Evidence (max 3 images)</Text>
            <View style={styles.evidenceRow}>
              {evidence.map((uri, i) => (
                <View key={i} style={styles.evidenceWrap}>
                  <Image source={{ uri }} style={styles.evidence} />
                  <TouchableOpacity
                    style={styles.removeEvidence}
                    onPress={() =>
                      setEvidence((prev) => prev.filter((_, idx) => idx !== i))
                    }
                  >
                    <Text style={styles.removeEvidenceText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {evidence.length < 3 && (
                <TouchableOpacity style={styles.addEvidence} onPress={pickEvidence}>
                  <Text style={styles.addEvidenceText}>+ Add</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={submitting || !reason}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitText}>Submit Report</Text>
              )}
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
    maxHeight: "92%",
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
  close: { fontSize: 20, color: "#666", fontWeight: "600", width: 24 },
  title: { fontSize: 17, fontWeight: "800", color: "#1A1A1A" },
  scroll: { padding: 20, paddingBottom: 40 },
  targetText: { fontSize: 13, color: "#666", marginBottom: 16 },
  targetBold: { fontWeight: "800", color: "#1A1A1A" },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginTop: 8,
    marginBottom: 10,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#F0F0F0",
    marginBottom: 8,
  },
  reasonRowActive: { borderColor: "#E91E63", backgroundColor: "#FFF0F5" },
  reasonEmoji: { fontSize: 22, marginRight: 12 },
  reasonLabel: { fontSize: 14, fontWeight: "700", color: "#333" },
  reasonLabelActive: { color: "#E91E63" },
  reasonDesc: { fontSize: 12, color: "#999", marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#CCC",
    justifyContent: "center",
    alignItems: "center",
  },
  radioActive: { borderColor: "#E91E63" },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#E91E63" },
  textArea: {
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    minHeight: 100,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#FAFAFA",
    color: "#333",
  },
  evidenceRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  evidenceWrap: { position: "relative" },
  evidence: { width: 80, height: 80, borderRadius: 10 },
  removeEvidence: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
  },
  removeEvidenceText: { color: "#FFF", fontSize: 12, fontWeight: "800" },
  addEvidence: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  addEvidenceText: { fontSize: 12, color: "#999", fontWeight: "700" },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  submitBtn: {
    height: 54,
    backgroundColor: "#E91E63",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  submitText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});