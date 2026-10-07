import React, { useEffect, useState } from "react";
import { TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { blockUser, unblockUser } from "../../services/safetyService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

interface Props {
  targetUid: string;
}

export default function BlockButton({ targetUid }: Props) {
  const { user } = useAuth();
  const [blocked, setBlocked] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user || user.uid === targetUid) return;
    (async () => {
      const snap = await getDoc(doc(db, "blocks", `${user.uid}_${targetUid}`));
      setBlocked(snap.exists());
    })();
  }, [user, targetUid]);

  if (!user || user.uid === targetUid || blocked === null) return null;

  const toggle = async () => {
    if (blocked) {
      Alert.alert("Unblock user?", "You'll be able to see them again.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unblock",
          onPress: async () => {
            await unblockUser(user.uid, targetUid);
            setBlocked(false);
          },
        },
      ]);
      return;
    }

    Alert.alert(
      "Block user?",
      "They won't be able to see your profile, join your Plans, or message you. You'll be removed from each other's Squads.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            try {
              // Fetch target profile for denormalization
              const targetSnap = await getDoc(doc(db, "users", targetUid));
              const target = targetSnap.exists() ? (targetSnap.data() as any) : null;
              await blockUser(
                user,
                {
                  uid: targetUid,
                  name: target?.name ?? "User",
                  photoUrl: target?.photoUrl ?? null,
                }
              );
              setBlocked(true);
            } catch (e: any) {
              Alert.alert("Error", e.message);
            }
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[styles.btn, blocked && styles.btnBlocked]}
      onPress={toggle}
    >
      <Text style={[styles.text, blocked && styles.textBlocked]}>
        {blocked ? "Unblock" : "Block"}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#FF3B30",
  },
  btnBlocked: { borderColor: "#666" },
  text: { fontSize: 13, fontWeight: "700", color: "#FF3B30" },
  textBlocked: { color: "#666" },
});