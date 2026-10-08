import "../src/lib/reactPolyfills";
import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import ErrorBoundary from "../src/components/ErrorBoundary";
import OfflineBanner from "../src/components/common/OfflineBanner";
import { useNotifications } from "../src/hooks/useNotifications";
import { attachDeepLinkHandler } from "../src/services/deepLinkService";
import { initSentry, setSentryUser, clearSentryUser } from "../src/lib/sentry";

// ─────────────────────────────────────────────────────────
// Initialize Sentry once at module load.
// Must run BEFORE the component tree mounts so early crashes
// are captured. If EXPO_PUBLIC_SENTRY_DSN isn't set, initSentry()
// logs a warning and returns without initializing.
// ─────────────────────────────────────────────────────────
initSentry();

/**
 * AppBootstrap runs INSIDE AuthProvider so it can access the
 * signed-in user. It wires up three things that need auth context:
 *   1. Push notification token registration + tap routing
 *   2. Deep link URL handling
 *   3. Sentry user tagging (uid + email)
 *
 * Renders nothing — it's a side-effect-only component.
 */
function AppBootstrap() {
  const { user } = useAuth();

  // Registers push token, sets up channels, attaches tap handler
  useNotifications();

  // Attach deep link listener (garbacrew:// and https://garbacrew.app)
  useEffect(() => {
    const cleanup = attachDeepLinkHandler();
    return cleanup;
  }, []);

  // Tag Sentry events with the current user so crashes are attributable
  useEffect(() => {
    if (user) {
      setSentryUser(user.uid, user.email);
    } else {
      clearSentryUser();
    }
  }, [user]);

  return null;
}

/**
 * RootLayout is the top of the component tree. It wraps everything
 * in an ErrorBoundary (to catch render crashes) and AuthProvider
 * (for Firebase auth state).
 *
 * Layout:
 *   ErrorBoundary
 *     AuthProvider
 *       View (flex: 1)
 *         StatusBar
 *         AppBootstrap (invisible side effects)
 *         OfflineBanner (shows only when offline)
 *         Stack (all routes)
 */
export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <View style={styles.root}>
          <StatusBar style="dark" />
          <AppBootstrap />
          <OfflineBanner />

          <Stack screenOptions={{ headerShown: false }}>
            {/* ─── Entry + Auth group ─── */}
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />

            {/* ─── Main tabs ─── */}
            <Stack.Screen name="(tabs)" />

            {/* ─── Epic 3: Plan System ─── */}
            <Stack.Screen
              name="plan/create"
              options={{
                presentation: "modal",
                animation: "slide_from_bottom",
              }}
            />
            <Stack.Screen name="plan/[id]" />
            <Stack.Screen name="plan/chat/[id]" />

            {/* ─── Epic 4: Squad System ─── */}
            <Stack.Screen
              name="squad/create"
              options={{
                presentation: "modal",
                animation: "slide_from_bottom",
              }}
            />
            <Stack.Screen name="squad/[id]" />

            {/* ─── Epic 5: Invitations ─── */}
            <Stack.Screen
              name="invite/create"
              options={{
                presentation: "modal",
                animation: "slide_from_bottom",
              }}
            />
            <Stack.Screen name="invitations/index" />

            {/* ─── Epic 6: Partner Discovery ─── */}
            <Stack.Screen name="partner/matches" />
            <Stack.Screen name="partner/chat/[id]" />

            {/* ─── Epic 7: Trust & Safety ─── */}
            <Stack.Screen name="settings/safety" />
            <Stack.Screen name="settings/emergency-contacts" />
            <Stack.Screen name="settings/blocked-users" />
            <Stack.Screen name="settings/disputes" />

            {/* ─── Epic 8: Monetization ─── */}
            <Stack.Screen name="wallet" />
            <Stack.Screen name="subscription" />
            <Stack.Screen name="boosts" />
            <Stack.Screen
              name="vendor/onboarding"
              options={{
                presentation: "modal",
                animation: "slide_from_bottom",
              }}
            />
          </Stack>
        </View>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFF" },
});