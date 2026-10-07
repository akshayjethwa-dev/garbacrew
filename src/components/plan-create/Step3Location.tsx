import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
} from "react-native";
import * as Location from "expo-location";
import { usePlanCreateStore } from "../../store/planCreateStore";
import { CITIES } from "../../constants/activities";

export default function Step3Location() {
  const { draft, updateDraft } = usePlanCreateStore();
  const [loading, setLoading] = useState(false);
  const [showCities, setShowCities] = useState(false);
  const [citySearch, setCitySearch] = useState("");

  const filteredCities = CITIES.filter((c) =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  );

  const detectLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Location permission denied. Enter address manually.");
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${loc.coords.latitude}&longitude=${loc.coords.longitude}&localityLanguage=en`
      );
      const geo = await response.json();

      updateDraft({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        city: geo.city || geo.locality || geo.principalSubdivision || "",
        locationAddress: geo.locality || "",
      });
    } catch (e) {
      console.warn(e);
      alert("Could not detect location. Please enter manually.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Where?</Text>

      <TouchableOpacity style={styles.detectBtn} onPress={detectLocation} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#E91E63" />
        ) : (
          <Text style={styles.detectText}>📍 Auto-detect my location</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>City</Text>
      <TouchableOpacity style={styles.input} onPress={() => setShowCities(!showCities)}>
        <Text style={draft.city ? styles.inputText : styles.placeholder}>
          {draft.city || "Select city"}
        </Text>
      </TouchableOpacity>

      {showCities && (
        <View style={styles.dropdown}>
          <TextInput
            style={styles.search}
            placeholder="Search..."
            value={citySearch}
            onChangeText={setCitySearch}
            autoFocus
          />
          {filteredCities.map((c) => (
            <TouchableOpacity
              key={c}
              style={styles.cityItem}
              onPress={() => {
                updateDraft({ city: c });
                setShowCities(false);
                setCitySearch("");
              }}
            >
              <Text style={styles.cityText}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.label}>Venue name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Juhu Beach"
        placeholderTextColor="#999"
        value={draft.locationName}
        onChangeText={(t) => updateDraft({ locationName: t })}
      />

      <Text style={styles.label}>Address (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Full address"
        placeholderTextColor="#999"
        value={draft.locationAddress}
        onChangeText={(t) => updateDraft({ locationAddress: t })}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "800", color: "#1A1A1A", marginBottom: 24 },
  detectBtn: {
    borderWidth: 1.5,
    borderColor: "#E91E63",
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  detectText: { fontSize: 15, fontWeight: "600", color: "#E91E63" },
  label: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 8, marginTop: 16 },
  input: {
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    justifyContent: "center",
    backgroundColor: "#FAFAFA",
  },
  inputText: { fontSize: 16, color: "#333" },
  placeholder: { fontSize: 16, color: "#999" },
  dropdown: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    maxHeight: 200,
    marginTop: 4,
  },
  search: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    fontSize: 15,
  },
  cityItem: { paddingHorizontal: 16, paddingVertical: 12 },
  cityText: { fontSize: 15, color: "#333" },
});