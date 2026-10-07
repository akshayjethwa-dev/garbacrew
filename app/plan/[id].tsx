import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getPlan, getPlanRole } from "../../src/services/planService";
import { Plan } from "../../src/types/plan";
import { getActivityMeta } from "../../src/constants/activities";
import { useAuth } from "../../src/context/AuthContext";

function formatFullDate(ts: any): string {
  if (!ts) return "TBD";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function PlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const p = await getPlan(id);
        if (!p) setError("Plan not found");
        else setPlan(p);
      } catch (e: any) {
        setError(e.message ?? "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E91E63" />
      </View>
    );
  }

  if (error || !plan) {
    return (
      <SafeAreaView style={styles.center} edges={["top"]}>
        <Text style={{ fontSize: 48 }}>😕</Text>
        <Text style={styles.errorText}>{error ?? "Plan not found"}</Text>
        <TouchableOpacity style={styles.backBtnAlt} onPress={() => router.back()}>
          <Text style={styles.backTextAlt}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const act = getActivityMeta(plan.activity);
  const role = user ? getPlanRole(plan, user.uid) : "visitor";

  const priceLabel =
    plan.costTotal > 0 ? `₹${plan.costPerPerson} / person` : "Free";
  const capacityLabel =
    plan.capacity === 0 ? "Unlimited" : `${plan.spotsFilled} / ${plan.capacity}`;

  let cta = "I'm In";
  let ctaDisabled = false;

  if (role === "host") cta = "Manage Plan";
  else if (role === "participant") cta = "You're in ✓";
  else if (role === "pending") cta = "Request pending…";
  else if (role === "waitlist") cta = "On waitlist";
  else if (plan.approvalMode === "manual" || plan.approvalMode === "paid_manual")
    cta = "Request to Join";
  else if (plan.costTotal > 0) cta = `Join & Pay ₹${plan.costPerPerson}`;

  const handlePrimaryAction = () => {
    Alert.alert(
      "Coming in Sprint 4",
      `The "${cta}" flow will be implemented in the next sprint.`
    );
  };

  const handleInvite = () => {
    router.push({
      pathname: "/invite/create",
      params: {
        type: "plan",
        targetId: plan.id,
        targetTitle: plan.title,
        targetActivity: plan.activity,
        existingMembers: plan.participants.join(","),
      },
    });
  };

  const showInviteBtn = role === "host" || role === "participant";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: act.color + "22" }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.heroEmoji}>{act.emoji}</Text>
          <View style={[styles.heroTag, { backgroundColor: act.color }]}>
            <Text style={styles.heroTagText}>{act.label}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{plan.title}</Text>
          {plan.description ? (
            <Text style={styles.desc}>{plan.description}</Text>
          ) : null}

          {/* Host */}
          <View style={styles.hostCard}>
            {plan.hostPhotoUrl ? (
              <Image source={{ uri: plan.hostPhotoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>
                  {plan.hostName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.hostName}>{plan.hostName}</Text>
              <Text style={styles.hostMeta}>
                ⭐ Host Score {plan.hostScore}
                {plan.hostVerified ? " · ✅ Verified" : ""}
              </Text>
            </View>
          </View>

          {/* Key info rows */}
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🕒</Text>
              <View>
                <Text style={styles.infoLabel}>When</Text>
                <Text style={styles.infoValue}>{formatFullDate(plan.startTime)}</Text>
                <Text style={styles.infoSub}>{plan.durationMinutes} min</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📍</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Where</Text>
                <Text style={styles.infoValue}>{plan.locationName}</Text>
                <Text style={styles.infoSub}>
                  {plan.locationAddress ? plan.locationAddress + ", " : ""}
                  {plan.city}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>👥</Text>
              <View>
                <Text style={styles.infoLabel}>Capacity</Text>
                <Text style={styles.infoValue}>{capacityLabel}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>💰</Text>
              <View>
                <Text style={styles.infoLabel}>Cost</Text>
                <Text style={styles.infoValue}>{priceLabel}</Text>
              </View>
            </View>
          </View>

          {/* Requirements */}
          {(plan.requirements.verifiedOnly ||
            plan.requirements.womenOnly ||
            plan.requirements.minGuestScore != null ||
            plan.requirements.skillLevel) && (
            <View style={styles.reqBox}>
              <Text style={styles.reqTitle}>Requirements</Text>
              <View style={styles.reqRow}>
                {plan.requirements.verifiedOnly && (
                  <View style={styles.reqBadge}>
                    <Text style={styles.reqText}>✓ Verified</Text>
                  </View>
                )}
                {plan.requirements.womenOnly && (
                  <View style={styles.reqBadge}>
                    <Text style={styles.reqText}>♀ Women</Text>
                  </View>
                )}
                {plan.requirements.minGuestScore != null && (
                  <View style={styles.reqBadge}>
                    <Text style={styles.reqText}>
                      Guest ≥ {plan.requirements.minGuestScore}
                    </Text>
                  </View>
                )}
                {plan.requirements.skillLevel && (
                  <View style={styles.reqBadge}>
                    <Text style={styles.reqText}>
                      {plan.requirements.skillLevel}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Participants */}
          <Text style={styles.sectionTitle}>
            Who's coming ({plan.participantDetails.length})
          </Text>
          {plan.participantDetails.length === 0 ? (
            <Text style={styles.emptyText}>No one yet — be the first!</Text>
          ) : (
            <View style={styles.avatarRow}>
              {plan.participantDetails.slice(0, 6).map((p) => (
                <View key={p.uid} style={styles.participantWrap}>
                  {p.photoUrl ? (
                    <Image
                      source={{ uri: p.photoUrl }}
                      style={styles.participant}
                    />
                  ) : (
                    <View style={[styles.participant, styles.avatarFallback]}>
                      <Text style={styles.avatarInitial}>
                        {p.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
              {plan.participantDetails.length > 6 && (
                <View style={[styles.participant, styles.moreBadge]}>
                  <Text style={styles.moreText}>
                    +{plan.participantDetails.length - 6}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={styles.ctaBar}>
        {showInviteBtn && (
          <TouchableOpacity style={styles.inviteBtn} onPress={handleInvite}>
            <Text style={styles.inviteText}>Invite</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.ctaBtn,
            { flex: 1 },
            ctaDisabled && { opacity: 0.5 },
          ]}
          onPress={handlePrimaryAction}
          disabled={ctaDisabled}
        >
          <Text style={styles.ctaText}>{cta}</Text>
        </TouchableOpacity>
      </View>
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
  content: { paddingBottom: 40 },
  hero: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  backBtn: {
    position: "absolute",
    top: 12,
    left: 16,
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  backIcon: { fontSize: 20, color: "#333" },
  heroEmoji: { fontSize: 72 },
  heroTag: {
    position: "absolute",
    bottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
  },
  heroTagText: { color: "#FFF", fontSize: 12, fontWeight: "700" },
  body: { padding: 24 },
  title: { fontSize: 26, fontWeight: "800", color: "#1A1A1A", marginBottom: 8 },
  desc: { fontSize: 15, color: "#666", lineHeight: 22, marginBottom: 20 },
  hostCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#FAFAFA",
    borderRadius: 14,
    marginBottom: 16,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  avatarFallback: {
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: { fontSize: 18, fontWeight: "700", color: "#999" },
  hostName: { fontSize: 15, fontWeight: "700", color: "#333" },
  hostMeta: { fontSize: 12, color: "#999", marginTop: 2 },
  infoBox: {
    backgroundColor: "#FAFAFA",
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  infoIcon: { fontSize: 22, marginRight: 14, width: 28, textAlign: "center" },
  infoLabel: { fontSize: 12, color: "#999", fontWeight: "600" },
  infoValue: { fontSize: 15, color: "#333", fontWeight: "600", marginTop: 2 },
  infoSub: { fontSize: 12, color: "#999", marginTop: 2 },
  reqBox: { marginBottom: 16 },
  reqTitle: { fontSize: 14, fontWeight: "700", color: "#333", marginBottom: 8 },
  reqRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  reqBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#E3F2FD",
    borderRadius: 14,
  },
  reqText: { fontSize: 12, color: "#1565C0", fontWeight: "600" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A1A1A",
    marginTop: 12,
    marginBottom: 12,
  },
  emptyText: { fontSize: 14, color: "#999", marginBottom: 24 },
  avatarRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  participantWrap: {},
  participant: { width: 44, height: 44, borderRadius: 22 },
  moreBadge: {
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  moreText: { fontSize: 14, fontWeight: "700", color: "#666" },
  ctaBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    flexDirection: "row",
    alignItems: "center",
  },
  inviteBtn: {
    paddingHorizontal: 20,
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E91E63",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    backgroundColor: "#FFF",
  },
  inviteText: { color: "#E91E63", fontSize: 15, fontWeight: "700" },
  ctaBtn: {
    height: 56,
    backgroundColor: "#E91E63",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  errorText: { fontSize: 16, color: "#666", marginTop: 12, marginBottom: 24 },
  backBtnAlt: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#E91E63",
    borderRadius: 12,
  },
  backTextAlt: { color: "#FFF", fontWeight: "700", fontSize: 16 },
});