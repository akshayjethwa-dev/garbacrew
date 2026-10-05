import React, { useState, useEffect } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { signInWithGoogle } from "../../services/authService";
import { useRouter } from "expo-router";

WebBrowser.maybeCompleteAuthSession();

// ⚠️ IMPORTANT: Replace these with your actual Google OAuth Client IDs
// from the Google Cloud Console (https://console.cloud.google.com/apis/credentials)
const GOOGLE_WEB_CLIENT_ID =
  "490755900218-f0prm0ugk872u5khso67946ndu7e4q2m.apps.googleusercontent.com";
const GOOGLE_IOS_CLIENT_ID =
  "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com";
const GOOGLE_ANDROID_CLIENT_ID =
  "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com";

export default function GoogleSignInButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // ✅ Use useIdTokenAuthRequest to get id_token directly
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === "success") {
      // ✅ The id_token is inside response.params, not response.authentication
      const { id_token } = response.params;

      if (!id_token) {
        Alert.alert(
          "Sign-In Failed",
          "Could not retrieve ID token. Please try again."
        );
        return;
      }

      handleGoogleSignIn(id_token);
    }

    if (response?.type === "error") {
      Alert.alert(
        "Sign-In Error",
        response.error?.message || "Google sign-in failed."
      );
    }
  }, [response]);

  const handleGoogleSignIn = async (idToken: string) => {
    setLoading(true);
    const result = await signInWithGoogle(idToken);
    setLoading(false);

    if (result.user) {
      if (result.needsPhone) {
        Alert.alert(
          "Phone Required",
          "Please add your phone number to continue. This helps us keep GarbaCrew safe.",
          [
            {
              text: "Add Phone",
              onPress: () => router.replace("/(auth)/login"),
            },
          ]
        );
      } else if (result.user.profileComplete) {
        router.replace("/(tabs)/crews");
      } else {
        router.replace("/(auth)/profile-setup");
      }
    } else {
      Alert.alert("Error", result.error || "Google sign-in failed");
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => promptAsync()}
      disabled={!request || loading}
    >
      {loading ? (
        <ActivityIndicator color="#333" />
      ) : (
        <>
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.buttonText}>Continue with Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 14,
    height: 56,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: "800",
    color: "#4285F4",
    marginRight: 10,
  },
  buttonText: { fontSize: 16, fontWeight: "600", color: "#333" },
});