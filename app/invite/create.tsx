import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { GarbaCrewUser } from "../../src/types/user";
import {
  searchUsersByName,
  suggestInvitees,
} from "../../src/services/userSearchService";
import { sendInvitations } from "../../src/services/invitationService";

export default function InviteCreateScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    type: "plan" | "squad";
    targetId: string;
    targetTitle: string;
    targetActivity: string;
    existingMembers?: string; // comma-separated uids
  }>();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<GarbaCrewUser[]>([]);
  const [suggestions, setSuggestions] = useState<GarbaCrewUser[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);

  const existingMembers = (params.existingMembers ?? "")
    .split(",")
    .filter(Boolean);
  const excludeUids = [user?.uid ?? "", ...existingMembers];

  // Load suggestions on mount
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const list = await suggestInvitees({
          city: user.city ?? "",
          activity: params.targetActivity ?? "",
          excludeUids,
        });
        setSuggestions(list);
      } finally {
        setLoadingSuggestions(false);
      }
    })();
  }, [user, params.targetActivity]);

  // Debounced search
  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const results = await searchUsersByName({
          searchTerm,
          excludeUids,
        });
        setSearchResults(results);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const toggleSelect = (uid: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const handleSend = async () => {
    if (!user) return;
    if (selected.size === 0) {
      Alert.alert("Pick at least one", "Select people to invite.");
      return;
    }

    setSending(true);
    try {
      const result = await sendInvitations({
        inviter: user,
        type: params.type,
        targetId: params.targetId,
        targetTitle: params.targetTitle,
        targetActivity: params.targetActivity,
        invitedUids: Array.from(selected),
        message,
      });

      Alert.alert(
        "Invites sent",
        `${result.sent} invitation${result.sent === 1 ? "" : "s"} sent.${
          result.skipped > 0
            ? ` ${result.skipped} skipped (already members or invited).`
            : ""
        }`,
        [{ text: "Done", onPress: () => router.back() }]
      );
    } catch (e: any) {
      Alert.alert("Could not send", e.message ?? "Try again.");
    } finally {
      setSending(false);
    }
  };

  const displayList =
    searchTerm.trim().length >= 2 ? searchResults : suggestions;
  const listTitle =
    searchTerm.trim().length >= 2 ? "Search results" : "Suggested for you";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invite to {params.targetTitle}</Text>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            style={styles.search}
            placeholder="Search by name..."
            placeholderTextColor="#999"
            value={searchTerm}
            onChangeText={setSearchTerm}
            autoCorrect={false}
          />

          {searching && (
            <ActivityIndicator color="#E91E63" style={{ marginTop: 12 }} />
          )}

          <Text style={styles.sectionTitle}>
            {listTitle}
            {loadingSuggestions && searchTerm.length < 2 ? " —" : ""}
          </Text>

          {loadingSuggestions && searchTerm.length < 2 ? (
            <ActivityIndicator color="#E91E63" style={{ marginTop: 12 }} />
          ) : displayList.length === 0 ? (
            <Text style={styles.emptyText}>
              {searchTerm.trim().length >= 2
                ? "No users found. Try a different name."
                : "No suggestions yet. Search by name to invite."}
            </Text>
          ) : (
            displayList.map((u) => (
              <TouchableOpacity
                key={u.uid}
                style={[
                  styles.userRow,
                  selected.has(u.uid) && styles.userRowSelected,
                ]}
                onPress={() => toggleSelect(u.uid)}
                activeOpacity={0.8}
              >
                {u.photoUrl ? (
                  <Image source={{ uri: u.photoUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarInitial}>
                      {(u.name ?? "?").charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>
                    {u.name}
                    {u.isVerified ? " ✅" : ""}
                  </Text>
                  <Text style={styles.meta}>
                    ⭐ {u.guestScore ?? 50} · {u.city ?? "—"}
                  </Text>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    selected.has(u.uid) && styles.checkboxActive,
                  ]}
                >
                  {selected.has(u.uid) && (
                    <Text style={styles.checkboxTick}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}

          <Text style={styles.sectionTitle}>Personal message (optional)</Text>
          <TextInput
            style={[styles.search, styles.textarea]}
            placeholder="Say hi and tell them why you'd love for them to join"
            placeholderTextColor="#999"
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={200}
            textAlignVertical="top"
          />
        </ScrollView>

        <View style={styles.footer}>
          <View style={{ flex: 1 }}>
            <Text style={styles.footerCount}>
              {selected.size} selected
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, sending && { opacity: 0.6 }]}
            onPress={handleSend}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.sendText}>Send Invites</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  closeText: { fontSize: 20, color: "#666", fontWeight: "600" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A1A", flex: 1, textAlign: "center" },
  scroll: { padding: 20, paddingBottom: 30 },
  search: {
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 16,
    fontSize: 15,
    backgroundColor: "#FAFAFA",
    color: "#333",
  },
  textarea: { height: 100, paddingTop: 14 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginTop: 24,
    marginBottom: 10,
  },
  emptyText: { fontSize: 13, color: "#999", marginTop: 8 },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#F0F0F0",
    marginBottom: 8,
    backgroundColor: "#FFF",
  },
  userRowSelected: { borderColor: "#E91E63", backgroundColor: "#FFF0F5" },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  avatarFallback: {
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: { fontSize: 16, fontWeight: "700", color: "#999" },
  name: { fontSize: 14, fontWeight: "700", color: "#333" },
  meta: { fontSize: 12, color: "#999", marginTop: 2 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#CCC",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: { borderColor: "#E91E63", backgroundColor: "#E91E63" },
  checkboxTick: { color: "#FFF", fontSize: 14, fontWeight: "800" },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    backgroundColor: "#FFF",
  },
  footerCount: { fontSize: 14, color: "#666", fontWeight: "600" },
  sendBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    backgroundColor: "#E91E63",
    borderRadius: 12,
  },
  sendText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
});