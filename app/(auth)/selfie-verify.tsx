import React from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import SelfieCapture from "../../src/components/selfie/SelfieCapture";

export default function SelfieVerifyScreen() {
  const router = useRouter();

  const handleComplete = (success: boolean) => {
    if (success) {
      Alert.alert("Verified! 🎉", "Your identity has been verified.", [
        { text: "Continue", onPress: () => router.replace("/(auth)/profile-setup") },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify your identity</Text>
      <Text style={styles.subtitle}>
        Follow the prompts to confirm you're a real person
      </Text>
      <SelfieCapture onComplete={handleComplete} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFF",
    textAlign: "center",
    marginTop: 60,
  },
  subtitle: {
    fontSize: 14,
    color: "#AAA",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 24,
  },
});