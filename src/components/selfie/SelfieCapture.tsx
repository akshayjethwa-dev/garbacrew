import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { verifySelfie, getRandomPrompts } from "../../services/verificationService";

interface SelfieCaptureProps {
  onComplete: (success: boolean) => void;
}

export default function SelfieCapture({ onComplete }: SelfieCaptureProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [prompts] = useState(() => getRandomPrompts(3));
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [frames, setFrames] = useState<string[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#E91E63" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Camera Access Required</Text>
        <Text style={styles.errorSubtitle}>
          We need camera access to verify your identity
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });

      if (photo?.base64) {
        const newFrames = [...frames, `data:image/jpeg;base64,${photo.base64}`];
        setFrames(newFrames);

        if (currentPromptIndex < prompts.length - 1) {
          setCurrentPromptIndex((prev) => prev + 1);
        } else {
          // All frames captured — verify
          await handleVerify(newFrames);
        }
      }
    } catch (err) {
      setError("Failed to capture. Please try again.");
    } finally {
      setCapturing(false);
    }
  };

  const handleVerify = async (allFrames: string[]) => {
    setVerifying(true);
    const result = await verifySelfie(allFrames);
    setVerifying(false);

    if (result.success) {
      onComplete(true);
    } else {
      setError(result.message);
      setFrames([]);
      setCurrentPromptIndex(0);
    }
  };

  const currentPrompt = prompts[currentPromptIndex];

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="front">
        {/* Oval guide */}
        <View style={styles.overlay}>
          <View style={styles.ovalGuide} />

          {/* Prompt */}
          <View style={styles.promptContainer}>
            <Text style={styles.promptIcon}>{currentPrompt.icon}</Text>
            <Text style={styles.promptText}>{currentPrompt.text}</Text>
          </View>

          {/* Progress dots */}
          <View style={styles.dots}>
            {prompts.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i <= currentPromptIndex && styles.dotActive]}
              />
            ))}
          </View>
        </View>
      </CameraView>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.captureButton, (capturing || verifying) && styles.buttonDisabled]}
        onPress={takePicture}
        disabled={capturing || verifying}
      >
        {capturing || verifying ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.captureText}>
            {currentPromptIndex < prompts.length - 1
              ? `Capture (${currentPromptIndex + 1}/${prompts.length})`
              : "Verify Identity"}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: "space-between", alignItems: "center", padding: 24 },
  ovalGuide: {
    width: 240,
    height: 320,
    borderRadius: 120,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.6)",
    marginTop: 60,
  },
  promptContainer: { alignItems: "center" },
  promptIcon: { fontSize: 48, marginBottom: 8 },
  promptText: { fontSize: 22, fontWeight: "700", color: "#FFF", textAlign: "center" },
  dots: { flexDirection: "row", gap: 8, marginBottom: 20 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  dotActive: { backgroundColor: "#E91E63" },
  captureButton: {
    backgroundColor: "#E91E63",
    margin: 24,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  captureText: { fontSize: 17, fontWeight: "700", color: "#FFF" },
  buttonDisabled: { opacity: 0.6 },
  errorText: {
    color: "#FF6B6B",
    textAlign: "center",
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  errorTitle: { fontSize: 22, fontWeight: "700", color: "#FFF", textAlign: "center" },
  errorSubtitle: {
    fontSize: 15,
    color: "#AAA",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 24,
  },
  permissionButton: {
    backgroundColor: "#E91E63",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  permissionText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
});