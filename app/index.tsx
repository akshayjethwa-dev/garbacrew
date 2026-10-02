import React from "react";
import { Redirect } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "../src/context/AuthContext";

export default function Index() {
  const { user, loading } = useAuth();

  // While Firebase is checking auth state, show a loader
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#E91E63" />
      </View>
    );
  }

  // Not signed in → login
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // Signed in but profile incomplete → profile setup
  if (!user.profileComplete) {
    return <Redirect href="/(auth)/profile-setup" />;
  }

  // All set → main feed
  return <Redirect href="/(tabs)/crews" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
});