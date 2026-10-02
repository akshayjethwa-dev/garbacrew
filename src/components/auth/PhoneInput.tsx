import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from "react-native";

const COUNTRY_CODES = [
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+1", country: "USA", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
];

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  countryCode: string;
  onCountryChange: (code: string) => void;
  error?: string;
}

export default function PhoneInput({
  value,
  onChangeText,
  countryCode,
  onCountryChange,
  error,
}: PhoneInputProps) {
  const [showPicker, setShowPicker] = useState(false);
  const selected = COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[0];

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    const maxLen = countryCode === "+91" ? 10 : 15;
    onChangeText(cleaned.slice(0, maxLen));
  };

  return (
    <View style={styles.container}>
      <View style={[styles.inputRow, error && styles.inputError]}>
        <TouchableOpacity
          style={styles.countryButton}
          onPress={() => setShowPicker(true)}
        >
          <Text style={styles.flag}>{selected.flag}</Text>
          <Text style={styles.code}>{selected.code}</Text>
          <Text style={styles.chevron}>▼</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.phoneInput}
          placeholder="9876543210"
          placeholderTextColor="#999"
          keyboardType="phone-pad"
          value={value}
          onChangeText={handlePhoneChange}
          maxLength={countryCode === "+91" ? 10 : 15}
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal visible={showPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <FlatList
              data={COUNTRY_CODES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryOption,
                    item.code === countryCode && styles.countryOptionActive,
                  ]}
                  onPress={() => {
                    onCountryChange(item.code);
                    setShowPicker(false);
                  }}
                >
                  <Text style={styles.flag}>{item.flag}</Text>
                  <Text style={styles.countryName}>{item.country}</Text>
                  <Text style={styles.code}>{item.code}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowPicker(false)}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    backgroundColor: "#FAFAFA",
    height: 56,
  },
  inputError: { borderColor: "#FF3B30" },
  countryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: "#E0E0E0",
    height: "100%",
  },
  flag: { fontSize: 20, marginRight: 4 },
  code: { fontSize: 16, fontWeight: "600", color: "#333" },
  chevron: { fontSize: 10, marginLeft: 4, color: "#999" },
  phoneInput: { flex: 1, fontSize: 16, paddingHorizontal: 12, color: "#333" },
  errorText: { color: "#FF3B30", fontSize: 13, marginTop: 6, marginLeft: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "60%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  countryOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  countryOptionActive: { backgroundColor: "#FFF0F5" },
  countryName: { flex: 1, fontSize: 16, marginLeft: 10 },
  closeButton: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
  },
  closeText: { fontSize: 16, fontWeight: "600", color: "#333" },
});