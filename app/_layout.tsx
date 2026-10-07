import "../src/lib/reactPolyfills";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../src/context/AuthContext";
import ErrorBoundary from "../src/components/ErrorBoundary";

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="plan/create"
            options={{ presentation: "modal", animation: "slide_from_bottom" }}
          />
          <Stack.Screen name="plan/[id]" />
          <Stack.Screen
            name="squad/create"
            options={{ presentation: "modal", animation: "slide_from_bottom" }}
          />
          <Stack.Screen name="squad/[id]" />
          <Stack.Screen
            name="invite/create"
            options={{ presentation: "modal", animation: "slide_from_bottom" }}
          />
          <Stack.Screen name="invitations/index" />
          <Stack.Screen name="partner/matches" />
          <Stack.Screen name="partner/chat/[id]" />
          <Stack.Screen name="settings/safety" />
          <Stack.Screen name="settings/emergency-contacts" />
          <Stack.Screen name="settings/blocked-users" />
          <Stack.Screen name="settings/disputes" />
        </Stack>
      </AuthProvider>
    </ErrorBoundary>
  );
}