import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";

interface Props {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingState({ message, fullScreen = true }: Props) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color="#E91E63" />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  fullScreen: { flex: 1, backgroundColor: "#FFF" },
  message: { marginTop: 16, fontSize: 14, color: "#666" },
});