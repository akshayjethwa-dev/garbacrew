import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useProfileStore } from "../../store/profileStore";

export default function StepPhoto() {
  const { data, updateData } = useProfileStore();

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert("Permission required to access photos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      updateData({ photoUri: result.assets[0].uri });
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      alert("Camera permission required");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      updateData({ photoUri: result.assets[0].uri });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add a profile photo</Text>
      <Text style={styles.subtitle}>
        Profiles with photos get 3x more connections
      </Text>

      <View style={styles.avatarContainer}>
        {data.photoUri ? (
          <Image source={{ uri: data.photoUri }} style={styles.avatar} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderIcon}>📷</Text>
          </View>
        )}
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.button} onPress={takePhoto}>
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonText}>Choose from Gallery</Text>
        </TouchableOpacity>
      </View>

      {data.photoUri && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => updateData({ photoUri: null })}
        >
          <Text style={styles.skipText}>Remove photo</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.skipHint}>
        You can skip this — but your profile score will be lower
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", paddingHorizontal: 24 },
  title: { fontSize: 24, fontWeight: "800", color: "#1A1A1A", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 32, textAlign: "center" },
  avatarContainer: { marginBottom: 32 },
  avatar: { width: 160, height: 160, borderRadius: 80 },
  placeholder: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
  },
  placeholderIcon: { fontSize: 48 },
  buttons: { width: "100%", gap: 12 },
  button: {
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#E91E63",
    borderRadius: 14,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: { fontSize: 16, fontWeight: "600", color: "#E91E63" },
  skipButton: { marginTop: 16 },
  skipText: { fontSize: 14, color: "#999", textDecorationLine: "underline" },
  skipHint: { fontSize: 12, color: "#BBB", marginTop: 24, textAlign: "center" },
});