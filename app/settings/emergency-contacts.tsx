import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import {
  getEmergencyContacts,
  addEmergencyContact,
  removeEmergencyContact,
} from "../../src/services/safetyService";
import { EmergencyContact, MAX_EMERGENCY_CONTACTS } from "../../src/types/safety";

export default function EmergencyContactsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const list = await getEmergencyContacts(user.uid);
      setContacts(list);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleAdd = async () => {
    if (!user) return;
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Missing info", "Name and phone number are required.");
      return;
    }
    if (phone.trim().length < 10) {
      Alert.alert("Invalid phone", "Enter a valid phone number.");
      return;
    }
    setSaving(true);
    try {
      await addEmergencyContact(user.uid, { name, phone, relationship });
      setShowAdd(false);
      setName("");
      setPhone("");
      setRelationship("");
      await load();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = (c: EmergencyContact) => {
    Alert.alert("Remove contact?", `${c.name} won't be alerted in an SOS.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await removeEmergencyContact(user!.uid, c.id);
          await load();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E91E63" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Contacts</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.hint}>
          Up to {MAX_EMERGENCY_CONTACTS} people will get an SMS with your
          location when you trigger SOS.
        </Text>

        {contacts.map((c) => (
          <View key={c.id} style={styles.contactRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {c.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactName}>{c.name}</Text>
              <Text style={styles.contactMeta}>
                {c.phone}
                {c.relationship ? ` · ${c.relationship}` : ""}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => handleRemove(c)}
            >
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}

        {contacts.length < MAX_EMERGENCY_CONTACTS && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowAdd(true)}
          >
            <Text style={styles.addText}>+ Add Contact</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => setShowAdd(false)}>
                <Text style={styles.close}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.sheetTitle}>Add Contact</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.sheetScroll}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Mom"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
                maxLength={40}
              />

              <Text style={styles.label}>Phone number</Text>
              <TextInput
                style={styles.input}
                placeholder="+91 9876543210"
                placeholderTextColor="#999"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={15}
              />

              <Text style={styles.label}>Relationship (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Mother"
                placeholderTextColor="#999"
                value={relationship}
                onChangeText={setRelationship}
                maxLength={30}
              />
            </ScrollView>

            <View style={styles.sheetFooter}>
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleAdd}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backText: { fontSize: 22, color: "#666", fontWeight: "600", width: 24 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#1A1A1A" },
  scroll: { padding: 20 },
  hint: {
    fontSize: 13,
    color: "#666",
    lineHeight: 20,
    marginBottom: 20,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: "700", color: "#666" },
  contactName: { fontSize: 15, fontWeight: "700", color: "#1A1A1A" },
  contactMeta: { fontSize: 12, color: "#666", marginTop: 3 },
  removeBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  removeText: { fontSize: 13, color: "#FF3B30", fontWeight: "700" },
  addBtn: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E91E63",
    borderStyle: "dashed",
    alignItems: "center",
  },
  addText: { color: "#E91E63", fontWeight: "700", fontSize: 15 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  close: { fontSize: 20, color: "#666", fontWeight: "600", width: 24 },
  sheetTitle: { fontSize: 17, fontWeight: "800", color: "#1A1A1A" },
  sheetScroll: { padding: 20 },
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
    fontSize: 15,
    backgroundColor: "#FAFAFA",
    color: "#333",
  },
  sheetFooter: { padding: 16, borderTopWidth: 1, borderTopColor: "#F0F0F0" },
  saveBtn: {
    height: 54,
    backgroundColor: "#E91E63",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  saveText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});