import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { PartnerCandidate } from "../../types/partner";
import { getPartnerVibe } from "../../constants/partnerVibes";
import { getActivityMeta } from "../../constants/activities";
import { PlanActivity } from "../../types/plan";

export default function PartnerCard({ candidate }: { candidate: PartnerCandidate }) {
  const vibe = getPartnerVibe(candidate.partnerVibe);

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        {candidate.photoUrl ? (
          <Image source={{ uri: candidate.photoUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Text style={styles.initial}>
              {candidate.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        {candidate.isVerified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✅ Verified</Text>
          </View>
        )}

        {vibe && (
          <View style={styles.vibeBadge}>
            <Text style={styles.vibeText}>
              {vibe.emoji} {vibe.label}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>
            {candidate.name}, {candidate.age}
          </Text>
        </View>

        <Text style={styles.city}>📍 {candidate.city}</Text>

        {candidate.bio ? (
          <Text style={styles.bio} numberOfLines={3}>
            {candidate.bio}
          </Text>
        ) : null}

        {candidate.activities && candidate.activities.length > 0 && (
          <View style={styles.chipRow}>
            {candidate.activities.slice(0, 4).map((a) => {
              const meta = getActivityMeta(a as PlanActivity);
              return (
                <View key={a} style={styles.chip}>
                  <Text style={styles.chipText}>
                    {meta.emoji} {meta.label}
                  </Text>
                </View>
              );
            })}
            {candidate.activities.length > 4 && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>
                  +{candidate.activities.length - 4}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  imageWrap: { position: "relative", height: 340, backgroundColor: "#F0F0F0" },
  image: { width: "100%", height: "100%" },
  imageFallback: { justifyContent: "center", alignItems: "center" },
  initial: { fontSize: 96, fontWeight: "800", color: "#CCC" },
  verifiedBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  verifiedText: { fontSize: 12, fontWeight: "700", color: "#2E7D32" },
  vibeBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(233,30,99,0.95)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  vibeText: { fontSize: 12, fontWeight: "700", color: "#FFF" },
  body: { padding: 18 },
  nameRow: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 22, fontWeight: "800", color: "#1A1A1A" },
  city: { fontSize: 13, color: "#666", marginTop: 4 },
  bio: { fontSize: 14, color: "#444", marginTop: 10, lineHeight: 20 },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
  },
  chipText: { fontSize: 12, color: "#333", fontWeight: "600" },
});