import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import NetInfo from "@react-native-community/netinfo";

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOffline(state.isConnected === false);
    });
    return unsubscribe;
  }, []);

  if (!offline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>📡 You're offline. Some features may be limited.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#FFE0B2",
  },
  text: { fontSize: 12, color: "#E65100", fontWeight: "600" },
});