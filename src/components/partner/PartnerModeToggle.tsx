import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { setPartnerMode } from "../../services/partnerService";
import { PARTNER_VIBES } from "../../constants/partnerVibes";

export default function PartnerModeToggle() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const enabled = user?.lookingForPartner === true;
  const currentVibe = user?.partnerVibe ?? null;

  const handleToggle = async (next: boolean) => {
    if (!user) return;
    setSaving(true);
    try {
      await setPartnerMode(user.uid, next);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleVibe = async (vibe: string) => {
    if (!user) return;
    setSaving(true);
    try {
      await setPartnerMode(user.uid, true, vibe);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Partner Mode</Text>
          <Text style={styles.subtitle}>
            Discover people 1-on-1 for activities
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={handleToggle}
          disabled={saving}
          trackColor={{ true: "#E91E63" }}
        />
      </View>

      {enabled && (
        <>
          <Text style={styles.vibeLabel}>Your vibe</Text>
          <View style={styles.chipRow}>
            {PARTNER_VIBES.map((v) => {
              const active = currentVibe === v.value;
              return (
                <TouchableOpacity
                  key={v.value}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => handleVibe(v.value)}
                  disabled={saving}
                >
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                  >
                    {v.emoji} {v.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
    padding: 18,
    backgroundColor: "#FFF0F5",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#F8BBD0",
    marginBottom: 16,
  },
  switchRow: { flexDirection: "row", alignItems: "center" },
  title: { fontSize: 15, fontWeight: "800", color: "#E91E63" },
  subtitle: { fontSize: 12, color: "#666", marginTop: 2 },
  vibeLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#333",
    marginTop: 16,
    marginBottom: 10,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#F8BBD0",
    backgroundColor: "#FFF",
  },
  chipActive: { borderColor: "#E91E63", backgroundColor: "#E91E63" },
  chipText: { fontSize: 12, fontWeight: "600", color: "#E91E63" },
  chipTextActive: { color: "#FFF" },
});