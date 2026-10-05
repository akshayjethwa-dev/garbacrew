import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as Location from "expo-location";
import { useProfileStore } from "../../store/profileStore";

const CITIES = [
  "Mumbai",
  "Pune",
  "Ahmedabad",
  "Surat",
  "Vadodara",
  "Rajkot",
  "Delhi",
  "Bangalore",
];

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
      // 1. Request permission (works on web and native)
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert(
          "Location permission denied. Please enter your city manually."
        );
        setLoading(false);
        return;
      }

      // 2. Get GPS coordinates (still supported on web)
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      // 3. Reverse-geocode using BigDataCloud (free, no API key)
      //    This replaces the removed Location.reverseGeocodeAsync
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );

      if (!response.ok) {
        throw new Error("Reverse geocoding failed");
      }

      const geo = await response.json();

      // BigDataCloud response fields:
      //   city, locality, principalSubdivision (state), countryName
      const detectedCity =
        geo.city || geo.locality || geo.principalSubdivision || "";
      const detectedArea =
        geo.locality || geo.principalSubdivision || "";

      updateData({
        latitude,
        longitude,
        city: detectedCity,
        area: detectedArea,
      });
    } catch (error) {
      console.error("Location detection error:", error);
      alert(
        "Could not detect location automatically. Please enter your city manually."
      );
    } finally {
      setLoading(false);
    }
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