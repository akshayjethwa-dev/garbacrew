import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { PlanJoinRequest } from "../../types/plan";

interface Props {
  request: PlanJoinRequest;
  onApprove: () => Promise<void>;
  onDecline: () => Promise<void>;
}

export default function RequestCard({ request, onApprove, onDecline }: Props) {
  const [working, setWorking] = useState<"approve" | "decline" | null>(null);

  const handleApprove = async () => {
    setWorking("approve");
    try {
      await onApprove();
    } finally {
      setWorking(null);
    }
  };

  const handleDecline = async () => {
    setWorking("decline");
    try {
      await onDecline();
    } finally {
      setWorking(null);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {request.photoUrl ? (
          <Image source={{ uri: request.photoUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>
              {request.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{request.name}</Text>
            {request.isVerified && <Text style={styles.verifiedBadge}>✅</Text>}
          </View>
          <Text style={styles.meta}>
            ⭐ {request.guestScore}
            {request.age ? ` · ${request.age}y` : ""}
          </Text>
        </View>
      </View>

      {request.bio ? (
        <Text style={styles.bio} numberOfLines={3}>
          {request.bio}
        </Text>
      ) : null}

      {request.message ? (
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>"{request.message}"</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, styles.declineBtn]}
          onPress={handleDecline}
          disabled={!!working}
        >
          {working === "decline" ? (
            <ActivityIndicator color="#666" />
          ) : (
            <Text style={styles.declineText}>Decline</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.approveBtn]}
          onPress={handleApprove}
          disabled={!!working}
        >
          {working === "approve" ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.approveText}>Approve</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "#F8BBD0",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  avatarFallback: {
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: { fontSize: 18, fontWeight: "700", color: "#999" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { fontSize: 15, fontWeight: "700", color: "#1A1A1A" },
  verifiedBadge: { fontSize: 13 },
  meta: { fontSize: 12, color: "#999", marginTop: 3 },
  bio: { fontSize: 13, color: "#555", lineHeight: 19, marginBottom: 8 },
  messageBox: {
    backgroundColor: "#FAFAFA",
    borderLeftWidth: 3,
    borderLeftColor: "#E91E63",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  messageText: { fontSize: 13, color: "#555", fontStyle: "italic" },
  actions: { flexDirection: "row", gap: 10 },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  declineBtn: { borderWidth: 1.5, borderColor: "#E0E0E0", backgroundColor: "#FFF" },
  declineText: { fontSize: 14, fontWeight: "700", color: "#666" },
  approveBtn: { backgroundColor: "#E91E63" },
  approveText: { fontSize: 14, fontWeight: "700", color: "#FFF" },
});