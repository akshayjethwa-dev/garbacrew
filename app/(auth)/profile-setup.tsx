import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useProfileStore, TOTAL_STEPS } from "../../src/store/profileStore";
import { auth, db } from "../../src/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { uploadProfilePhoto } from "../../src/services/storageService";
import { computeProfileScore } from "../../src/services/userService";

import ProgressBar from "../../src/components/profile-setup/ProgressBar";
import StepPhoto from "../../src/components/profile-setup/StepPhoto";
import StepBasicInfo from "../../src/components/profile-setup/StepBasicInfo";
import StepLocation from "../../src/components/profile-setup/StepLocation";
import StepLanguages from "../../src/components/profile-setup/StepLanguages";
import StepActivities from "../../src/components/profile-setup/StepActivities";
import StepDanceSkill from "../../src/components/profile-setup/StepDanceSkill";
import StepGroupPref from "../../src/components/profile-setup/StepGroupPref";
import StepVibe from "../../src/components/profile-setup/StepVibe";
import StepBio from "../../src/components/profile-setup/StepBio";

export default function ProfileSetupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ isNewUser?: string }>();
  const { currentStep, nextStep, prevStep, data } = useProfileStore();
  const [saving, setSaving] = useState(false);

  const steps = [
    <StepPhoto key={0} />,
    <StepBasicInfo key={1} />,
    <StepLocation key={2} />,
    <StepLanguages key={3} />,
    <StepActivities key={4} />,
    <StepDanceSkill key={5} />,
    <StepGroupPref key={6} />,
    <StepVibe key={7} />,
    <StepBio key={8} />,
  ];

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        if (!data.name.trim()) {
          Alert.alert("Required", "Please enter your name");
          return false;
        }
        if (!data.age || data.age < 18) {
          Alert.alert("Must be 18+", "You must be at least 18 years old.");
          return false;
        }
        if (!data.gender) {
          Alert.alert("Required", "Please select your gender");
          return false;
        }
        return true;
      case 2:
        if (!data.city) {
          Alert.alert("Required", "Please select your city");
          return false;
        }
        return true;
      case 3:
        if (data.languages.length === 0) {
          Alert.alert("Required", "Select at least one language");
          return false;
        }
        return true;
      case 4:
        if (data.activities.length === 0) {
          Alert.alert("Required", "Select at least one activity");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    if (currentStep < TOTAL_STEPS - 1) {
      nextStep();
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
  const user = auth.currentUser;
  console.log("🔍 Auth check before upload:", {
    uid: user?.uid,
    email: user?.email,
    isAnonymous: user?.isAnonymous,
    emailVerified: user?.emailVerified,
  });

  if (!user) {
    Alert.alert("Error", "Not authenticated");
    return;
  }

    setSaving(true);
    try {
      let photoUrl: string | null = null;

      if (data.photoUri) {
        photoUrl = await uploadProfilePhoto(user.uid, data.photoUri);
      }

      const score = computeProfileScore({
        ...data,
        photoUrl,
      });

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        ...data,
        photoUrl,
        profileComplete: true,
        profileScore: score,
        updatedAt: serverTimestamp(),
      });

      // ✅ This now works because app/(tabs)/crews.tsx exists
      router.replace("/(tabs)/crews");
    } catch (error: any) {
      console.error("Profile save error:", error);
      Alert.alert("Error", "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {steps[currentStep]}
      </ScrollView>

      <View style={styles.footer}>
        {currentStep > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={prevStep}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.nextButton,
            currentStep === 0 && { flex: 1, marginLeft: 0 },
            saving && styles.buttonDisabled,
          ]}
          onPress={handleNext}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.nextText}>
              {currentStep === TOTAL_STEPS - 1 ? "Complete Profile" : "Next"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    backgroundColor: "#FFF",
    gap: 12,
  },
  backButton: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  backText: { fontSize: 16, fontWeight: "600", color: "#333" },
  nextButton: {
    flex: 2,
    height: 54,
    borderRadius: 14,
    backgroundColor: "#E91E63",
    justifyContent: "center",
    alignItems: "center",
  },
  nextText: { fontSize: 16, fontWeight: "700", color: "#FFF" },
  buttonDisabled: { opacity: 0.6 },
});