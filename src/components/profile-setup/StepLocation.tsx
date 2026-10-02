import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import * as Location from "expo-location";
import { useProfileStore } from "../../store/profileStore";

const CITIES = ["Mumbai", "Pune", "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Delhi", "Bangalore"];

export default function StepLocation() {
  const { data, updateData } = useProfileStore();
  const [loading, setLoading] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [showCityList, setShowCityList] = useState(false);

  const filteredCities = CITIES.filter((c) =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  );

  const detectLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Location permission denied. Please enter manually.");
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      updateData({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        city: address?.city || address?.subregion || "",
        area: address?.district || address?.street || "",
      });
    } catch (error) {
      alert("Could not detect location. Please enter manually.");
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Where are you based?</Text>
      <Text style={styles.subtitle}>
        We use this to find Plans near you
      </Text>

      <TouchableOpacity
        style={styles.detectButton}
        onPress={detectLocation}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#E91E63" />
        ) : (
          <Text style={styles.detectText}>📍 Auto-detect my location</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>City</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowCityList(!showCityList)}
      >
        <Text style={data.city ? styles.inputText : styles.placeholder}>
          {data.city || "Select your city"}
        </Text>
      </TouchableOpacity>

      {showCityList && (
        <View style={styles.cityList}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search city..."
            value={citySearch}
            onChangeText={setCitySearch}
            autoFocus
          />
          {filteredCities.map((city) => (
            <TouchableOpacity
              key={city}
              style={styles.cityItem}
              onPress={() => {
                updateData({ city });
                setShowCityList(false);
                setCitySearch("");
              }}
            >
              <Text style={styles.cityItemText}>{city}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.label}>Area / Locality (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., Andheri West"
        placeholderTextColor="#999"
        value={data.area}
        onChangeText={(text) => updateData({ area: text })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24 },
  title: { fontSize: 24, fontWeight: "800", color: "#1A1A1A", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 24 },
  detectButton: {
    borderWidth: 1.5,
    borderColor: "#E91E63",
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  detectText: { fontSize: 15, fontWeight: "600", color: "#E91E63" },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 16,
  },
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
  cityList: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    maxHeight: 200,
    marginTop: 4,
  },
  searchInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    fontSize: 15,
  },
  cityItem: { paddingHorizontal: 16, paddingVertical: 12 },
  cityItemText: { fontSize: 15, color: "#333" },
});