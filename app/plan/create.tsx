import React, { useState } from "react";
import {
  View,
  Text,
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
import { usePlanCreateStore, TOTAL_PLAN_STEPS } from "../../src/store/planCreateStore";
import { useAuth } from "../../src/context/AuthContext";
import { createPlan } from "../../src/services/planService";
import { checkTrustAccess } from "../../src/services/accessControl";

import Step1Activity from "../../src/components/plan-create/Step1Activity";
import Step2Details from "../../src/components/plan-create/Step2Details";
import Step3Location from "../../src/components/plan-create/Step3Location";
import Step4Capacity from "../../src/components/plan-create/Step4Capacity";
import Step5Requirements from "../../src/components/plan-create/Step5Requirements";
import Step6Approval from "../../src/components/plan-create/Step6Approval";
import Step7Visibility from "../../src/components/plan-create/Step7Visibility";
import Step8Review from "../../src/components/plan-create/Step8Review";

export default function CreatePlanScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentStep, nextStep, prevStep, draft, reset } = usePlanCreateStore();
  const [saving, setSaving] = useState(false);

  // Guard: user must be able to create Plans
  const access = checkTrustAccess(user, "create_plan");
  if (!access.allowed) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.deniedContainer}>
          <Text style={styles.deniedEmoji}>🚫</Text>
          <Text style={styles.deniedTitle}>Can't create a Plan right now</Text>
          <Text style={styles.deniedText}>{access.reason}</Text>
          <TouchableOpacity
            style={styles.deniedButton}
            onPress={() => router.back()}
          >
            <Text style={styles.deniedButtonText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const steps = [
    <Step1Activity key={0} />,
    <Step2Details key={1} />,
    <Step3Location key={2} />,
    <Step4Capacity key={3} />,
    <Step5Requirements key={4} />,
    <Step6Approval key={5} />,
    <Step7Visibility key={6} />,
    <Step8Review key={7} />,
  ];

  const validateStep = (): boolean => {
    switch (currentStep) {
      case 0:
        if (!draft.activity) {
          Alert.alert("Pick an activity", "Select what you'll be doing.");
          return false;
        }
        if (draft.activity === "custom" && !draft.activityCustom.trim()) {
          Alert.alert("Describe the activity", "Please describe your custom activity.");
          return false;
        }
        return true;
      case 1:
        if (!draft.title.trim()) {
          Alert.alert("Add a title", "Give your Plan a short title.");
          return false;
        }
        if (!draft.startDate) {
          Alert.alert("Pick a date", "Enter a valid date in YYYY-MM-DD format.");
          return false;
        }
        if (!/^\d{2}:\d{2}$/.test(draft.startTime)) {
          Alert.alert("Pick a time", "Enter time in HH:MM format (e.g., 18:30).");
          return false;
        }
        const [hh, mm] = draft.startTime.split(":").map(Number);
        const start = new Date(draft.startDate);
        start.setHours(hh, mm, 0, 0);
        if (start.getTime() <= Date.now()) {
          Alert.alert("Future date", "Plan start time must be in the future.");
          return false;
        }
        return true;
      case 2:
        if (!draft.city) {
          Alert.alert("Pick a city", "Select the city for your Plan.");
          return false;
        }
        if (!draft.locationName.trim()) {
          Alert.alert("Add venue", "Enter the venue or meeting point.");
          return false;
        }
        return true;
      case 3:
        if (draft.costTotal > 0 && draft.capacity === 0) {
          Alert.alert(
            "Paid + unlimited",
            "Paid Plans need a fixed capacity so we can calculate per-person cost."
          );
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (!validateStep()) return;
    if (currentStep < TOTAL_PLAN_STEPS - 1) {
      nextStep();
      return;
    }
    // Final step — create the Plan
    await submitPlan();
  };

  const submitPlan = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const planId = await createPlan(user, draft);
      reset();
      router.replace({ pathname: "/plan/[id]", params: { id: planId } });
    } catch (e: any) {
      Alert.alert("Could not create Plan", e.message ?? "Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    Alert.alert("Discard Plan?", "Your progress will be lost.", [
      { text: "Keep editing", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: () => {
          reset();
          router.back();
        },
      },
    ]);
  };

  const progressPct = ((currentStep + 1) / TOTAL_PLAN_STEPS) * 100;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
            </View>
          </View>
          <Text style={styles.stepLabel}>
            {currentStep + 1}/{TOTAL_PLAN_STEPS}
          </Text>
        </View>

        {/* Step content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          {steps[currentStep]}
        </ScrollView>

        {/* Footer nav */}
        <View style={styles.footer}>
          {currentStep > 0 && (
            <TouchableOpacity style={styles.backBtn} onPress={prevStep}>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextBtn, currentStep === 0 && { flex: 1, marginLeft: 0 }, saving && { opacity: 0.6 }]}
            onPress={handleNext}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.nextText}>
                {currentStep === TOTAL_PLAN_STEPS - 1 ? "Post Plan" : "Next"}
              </Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  closeBtn: { padding: 8 },
  closeText: { fontSize: 20, color: "#666", fontWeight: "600" },
  progressTrack: {
    height: 6,
    backgroundColor: "#F0F0F0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#E91E63" },
  stepLabel: { fontSize: 13, color: "#999", fontWeight: "600" },
  footer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    backgroundColor: "#FFF",
  },
  backBtn: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  backText: { fontSize: 16, fontWeight: "600", color: "#333" },
  nextBtn: {
    flex: 2,
    height: 54,
    borderRadius: 14,
    backgroundColor: "#E91E63",
    justifyContent: "center",
    alignItems: "center",
  },
  nextText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  deniedContainer: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  deniedEmoji: { fontSize: 64, marginBottom: 16 },
  deniedTitle: { fontSize: 22, fontWeight: "800", color: "#1A1A1A", textAlign: "center" },
  deniedText: { fontSize: 14, color: "#666", textAlign: "center", marginTop: 8, lineHeight: 20 },
  deniedButton: {
    marginTop: 32,
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: "#E91E63",
    borderRadius: 12,
  },
  deniedButtonText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
});