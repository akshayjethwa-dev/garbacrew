import React, { useState } from "react";
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

// Replace with your Google OAuth Client IDs
const GOOGLE_CLIENT_ID =
  "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com";

export default function GoogleSignInButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_CLIENT_ID,
    iosClientId: "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com",
    androidClientId: "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com",
  });

  React.useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      handleGoogleSignIn(id_token);
    }
  }, [response]);

  const handleGoogleSignIn = async (idToken: string) => {
    setLoading(true);
    const result = await signInWithGoogle(idToken);
    setLoading(false);

    if (result.user) {
      if (result.needsPhone) {
        // Google user without phone — must add phone for one-account enforcement
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