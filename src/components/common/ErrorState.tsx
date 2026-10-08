import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface Props {
  title?: string;
  message?: string;
  onRetry?: () => void;
  emoji?: string;
}

export default function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this. Please try again.",
  onRetry,
  emoji = "😕",
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    backgroundColor: "#FFF",
  },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  retryBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    backgroundColor: "#E91E63",
    borderRadius: 12,
  },
  retryText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
});