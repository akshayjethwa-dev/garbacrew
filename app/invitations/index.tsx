import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import {
  getMyInvitations,
  acceptInvitation,
  declineInvitation,
} from "../../src/services/invitationService";
import { Invitation } from "../../src/types/invitation";

function timeAgo(ts: any): string {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function InvitationsScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const list = await getMyInvitations(user.uid);
      setInvitations(list);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (user) load();
    }, [user, load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleAccept = async (inv: Invitation) => {
    if (!user) return;
    setActing(inv.id);
    try {
      await acceptInvitation(inv, user);
      Alert.alert("Joined!", `You're now part of "${inv.targetTitle}"`, [
        {
          text: "View",
          onPress: () => {
            const path =
              inv.type === "plan" ? "/plan/[id]" : "/squad/[id]";
            router.push({
              pathname: path as any,
              params: { id: inv.targetId },
            });
          },
        },
        { text: "OK", style: "cancel" },
      ]);
      await load();
    } catch (e: any) {
      Alert.alert("Could not accept", e.message ?? "Try again.");
    } finally {
      setActing(null);
    }
  };

  const handleDecline = async (inv: Invitation) => {
    Alert.alert(
      "Decline invitation?",
      `You won't be added to "${inv.targetTitle}".`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: async () => {
            setActing(inv.id);
            try {
              await declineInvitation(inv.id);
              await load();
            } catch (e: any) {
              Alert.alert("Error", e.message);
            } finally {
              setActing(null);
            }
          },
        },
      ]
    );
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
        <Text style={styles.title}>Invitations</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={invitations}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#E91E63"
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📬</Text>
            <Text style={styles.emptyTitle}>No invitations yet</Text>
            <Text style={styles.emptyText}>
              When someone invites you to a Plan or Squad, it'll show up here.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isBusy = acting === item.id;
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                {item.inviterPhotoUrl ? (
                  <Image
                    source={{ uri: item.inviterPhotoUrl }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarInitial}>
                      {item.inviterName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.inviterName}>{item.inviterName}</Text>
                  <Text style={styles.timestamp}>{timeAgo(item.createdAt)}</Text>
                </View>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>
                    {item.type === "plan" ? "PLAN" : "SQUAD"}
                  </Text>
                </View>
              </View>

              <Text style={styles.targetLine}>
                invited you to{" "}
                <Text style={styles.targetName}>{item.targetTitle}</Text>
              </Text>

              {item.message ? (
                <View style={styles.messageBox}>
                  <Text style={styles.messageText}>"{item.message}"</Text>
                </View>
              ) : null}

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.btn, styles.declineBtn]}
                  onPress={() => handleDecline(item)}
                  disabled={isBusy}
                >
                  <Text style={styles.declineText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, styles.acceptBtn]}
                  onPress={() => handleAccept(item)}
                  disabled={isBusy}
                >
                  {isBusy ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.acceptText}>Accept</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
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
  title: { fontSize: 18, fontWeight: "800", color: "#1A1A1A" },
  list: { padding: 20 },
  empty: { paddingTop: 80, alignItems: "center" },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#1A1A1A", marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#666", textAlign: "center", paddingHorizontal: 32 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  avatarFallback: {
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: { fontSize: 16, fontWeight: "700", color: "#999" },
  inviterName: { fontSize: 14, fontWeight: "700", color: "#333" },
  timestamp: { fontSize: 11, color: "#999", marginTop: 2 },
  typeBadge: {
    backgroundColor: "#FFF0F5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeBadgeText: { fontSize: 10, fontWeight: "800", color: "#E91E63" },
  targetLine: { fontSize: 14, color: "#666", marginBottom: 12 },
  targetName: { fontWeight: "800", color: "#1A1A1A" },
  messageBox: {
    backgroundColor: "#FAFAFA",
    borderLeftWidth: 3,
    borderLeftColor: "#E91E63",
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  messageText: { fontSize: 13, color: "#555", fontStyle: "italic" },
  actions: { flexDirection: "row", gap: 10 },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  declineBtn: { borderWidth: 1.5, borderColor: "#E0E0E0", backgroundColor: "#FFF" },
  declineText: { fontSize: 14, fontWeight: "700", color: "#666" },
  acceptBtn: { backgroundColor: "#E91E63" },
  acceptText: { fontSize: 14, fontWeight: "700", color: "#FFF" },
});