import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../../src/lib/firebase";
import { useAuth } from "../../../src/context/AuthContext";
import {
  getMatchById,
  canISendFirstMessage,
  sendMatchMessage,
} from "../../../src/services/partnerService";
import { PartnerMatch } from "../../../src/types/partner";

interface Msg {
  id: string;
  fromUid: string;
  text: string;
  createdAt: Timestamp | any;
}

function formatTime(ts: any): string {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function PartnerChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [match, setMatch] = useState<PartnerMatch | null>(null);
  const [otherProfile, setOtherProfile] = useState<{
    name: string;
    photoUrl: string | null;
    gender: "male" | "female" | "other";
  } | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!id || !user) return;

    let unsubProfile: (() => void) | undefined;

    (async () => {
      const m = await getMatchById(id);
      if (!m) {
        setLoading(false);
        return;
      }
      const otherUid =
        (m.users ?? []).find((u: string) => u !== user.uid) ?? "";
      const otherName = "Unknown";
      setMatch({ ...m, otherUid, otherName });

      const profileRef = doc(db, "users", otherUid);
      unsubProfile = onSnapshot(profileRef, (snap) => {
        if (snap.exists()) {
          const p = snap.data() as any;
          setOtherProfile({
            name: p.name ?? "Someone",
            photoUrl: p.photoUrl ?? null,
            gender: p.gender ?? "other",
          });
        }
      });

      setLoading(false);
    })();

    return () => {
      if (unsubProfile) unsubProfile();
    };
  }, [id, user]);

  useEffect(() => {
    if (!id) return;

    const q = query(
      collection(db, "partnerMatches", id, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Msg)));
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
    });

    return () => unsub();
  }, [id]);

  const handleSend = async () => {
    if (!match || !user || !text.trim()) return;
    setSending(true);
    try {
      await sendMatchMessage(match.id, user, text);
      setText("");
    } catch (e: any) {
      Alert.alert("Could not send", e.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E91E63" />
      </View>
    );
  }

  if (!match || !user) {
    return (
      <SafeAreaView style={styles.center} edges={["top"]}>
        <Text style={{ fontSize: 48 }}>😕</Text>
        <Text style={styles.errorText}>Match not found</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace("/(tabs)/partners" as any)}
        >
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const myGender = (user.gender ?? "other") as "male" | "female" | "other";
  const otherGender = (otherProfile?.gender ?? "other") as
    | "male"
    | "female"
    | "other";
  const matchForCheck: PartnerMatch = { ...match, otherGender };
  const canSend = canISendFirstMessage(matchForCheck, user.uid, myGender);

  const deadlineLabel = match.firstMessageDeadline
    ? match.firstMessageDeadline.toDate
      ? match.firstMessageDeadline.toDate().toLocaleString()
      : new Date(match.firstMessageDeadline).toLocaleString()
    : "";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          {otherProfile?.photoUrl ? (
            <Image
              source={{ uri: otherProfile.photoUrl }}
              style={styles.headerAvatar}
            />
          ) : (
            <View style={[styles.headerAvatar, styles.avatarFallback]}>
              <Text style={styles.headerInitial}>
                {(otherProfile?.name ?? "?").charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.headerName}>{otherProfile?.name ?? "Match"}</Text>
            {match.superLike && (
              <Text style={styles.headerSuper}>⭐ Super Like match</Text>
            )}
          </View>
        </View>

        {!match.firstMessageBy && match.status === "pending_first_message" && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              {canSend.allowed
                ? "Send the first message to start the conversation 💬"
                : canSend.reason}
            </Text>
            {deadlineLabel ? (
              <Text style={styles.bannerSub}>Match expires {deadlineLabel}</Text>
            ) : null}
          </View>
        )}

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.messages}
          renderItem={({ item }) => {
            const mine = item.fromUid === user.uid;
            return (
              <View
                style={[
                  styles.bubble,
                  mine ? styles.bubbleMine : styles.bubbleTheirs,
                ]}
              >
                <Text style={mine ? styles.textMine : styles.textTheirs}>
                  {item.text}
                </Text>
                <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>💌</Text>
              <Text style={styles.emptyText}>
                No messages yet.
                {!canSend.allowed && canSend.reason
                  ? `\n\n${canSend.reason}`
                  : " Send the first one!"}
              </Text>
            </View>
          }
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder={
              canSend.allowed
                ? "Type a message..."
                : canSend.reason ?? "You can't send yet"
            }
            placeholderTextColor="#999"
            value={text}
            onChangeText={setText}
            editable={canSend.allowed}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!canSend.allowed || !text.trim() || sending) && { opacity: 0.5 },
            ]}
            onPress={handleSend}
            disabled={!canSend.allowed || !text.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.sendText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backText: { fontSize: 22, color: "#666", fontWeight: "600", width: 24 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, marginLeft: 8 },
  avatarFallback: {
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  headerInitial: { fontSize: 14, fontWeight: "700", color: "#999" },
  headerName: { fontSize: 15, fontWeight: "700", color: "#1A1A1A" },
  headerSuper: { fontSize: 11, color: "#E91E63", fontWeight: "600" },
  banner: {
    backgroundColor: "#FFF8E1",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#FFE082",
  },
  bannerText: { fontSize: 13, color: "#666", lineHeight: 18 },
  bannerSub: { fontSize: 11, color: "#999", marginTop: 4 },
  messages: { padding: 16, flexGrow: 1 },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 8,
  },
  bubbleMine: { alignSelf: "flex-end", backgroundColor: "#E91E63" },
  bubbleTheirs: { alignSelf: "flex-start", backgroundColor: "#F0F0F0" },
  textMine: { color: "#FFF", fontSize: 15 },
  textTheirs: { color: "#1A1A1A", fontSize: 15 },
  time: {
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: "#999", textAlign: "center" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    maxHeight: 100,
    backgroundColor: "#FAFAFA",
    color: "#333",
  },
  sendBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#E91E63",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sendText: { color: "#FFF", fontWeight: "700", fontSize: 14 },
  errorText: { fontSize: 16, color: "#666", marginTop: 12, marginBottom: 24 },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#E91E63",
    borderRadius: 12,
  },
  backBtnText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
});