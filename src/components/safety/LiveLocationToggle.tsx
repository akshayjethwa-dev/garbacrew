import React, { useEffect, useRef, useState } from "react";
import { TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import * as Location from "expo-location";
import { useAuth } from "../../context/AuthContext";
import {
  startLiveLocation,
  updateLiveLocation,
  stopLiveLocation,
} from "../../services/safetyService";
import { LIVE_LOCATION_INTERVAL_MS } from "../../types/safety";

interface Props {
  scopeType: "plan" | "squad" | "match";
  scopeId: string;
}

export default function LiveLocationToggle({ scopeType, scopeId }: Props) {
  const { user } = useAuth();
  const [on, setOn] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const begin = async () => {
    if (!user) return;

    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert(
        "Permission denied",
        "Enable location access to share your live location."
      );
      return;
    }

    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      await startLiveLocation({
        me: user,
        scopeType,
        scopeId,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy ?? null,
      });

      setOn(true);

      intervalRef.current = setInterval(async () => {
        try {
          const l = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          await updateLiveLocation(
            user,
            scopeId,
            l.coords.latitude,
            l.coords.longitude,
            l.coords.accuracy ?? null
          );
        } catch (e) {
          // silent
        }
      }, LIVE_LOCATION_INTERVAL_MS);
    } catch (e: any) {
      Alert.alert("Could not start", e.message);
    }
  };

  const end = async () => {
    if (!user) return;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    await stopLiveLocation(user.uid, scopeId);
    setOn(false);
  };

  const toggle = () => {
    if (on) end();
    else begin();
  };

  return (
    <TouchableOpacity
      style={[styles.btn, on && styles.btnOn]}
      onPress={toggle}
    >
      <Text style={[styles.text, on && styles.textOn]}>
        {on ? "📍 Sharing" : "📍 Share"}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    marginRight: 8,
  },
  btnOn: { backgroundColor: "#4CAF50" },
  text: { fontSize: 12, fontWeight: "700", color: "#666" },
  textOn: { color: "#FFF" },
});