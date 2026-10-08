import * as Linking from "expo-linking";
import { router } from "expo-router";

/**
 * Parses an incoming URL and routes the user to the appropriate screen.
 * Handles both `garbacrew://` scheme and `https://garbacrew.app/...` universal links.
 */
export function handleDeepLink(url: string): void {
  try {
    const { hostname, path, queryParams } = Linking.parse(url);
    // For universal links: https://garbacrew.app/plan/abc → hostname=garbacrew.app, path=plan/abc
    // For scheme links: garbacrew://plan/abc → hostname=plan, path=abc
    // Normalize both by extracting the segments
    const fullPath =
      hostname && hostname !== "garbacrew.app"
        ? `${hostname}/${path ?? ""}`.replace(/\/+$/, "")
        : path ?? "";

    const segments = fullPath.split("/").filter(Boolean);

    // ─── /plan/:id ───
    if (segments[0] === "plan" && segments[1]) {
      router.push(`/plan/${segments[1]}` as any);
      return;
    }

    // ─── /plan/chat/:id ───
    if (segments[0] === "plan" && segments[1] === "chat" && segments[2]) {
      router.push(`/plan/chat/${segments[2]}` as any);
      return;
    }

    // ─── /squad/:id ───
    if (segments[0] === "squad" && segments[1]) {
      router.push(`/squad/${segments[1]}` as any);
      return;
    }

    // ─── /invite/:code ───
    if (segments[0] === "invite" && segments[1]) {
      router.push(`/invite/${segments[1]}` as any);
      return;
    }

    // ─── /profile/:uid ───
    if (segments[0] === "profile" && segments[1]) {
      // Route to partner/[id] or a generic profile screen
      router.push(`/partner/chat/${segments[1]}` as any);
      return;
    }

    // ─── /vendor/onboarding ───
    if (segments[0] === "vendor" && segments[1] === "onboarding") {
      router.push("/vendor/onboarding" as any);
      return;
    }

    // ─── Fallback: home ───
    router.push("/" as any);
  } catch (error) {
    console.warn("Deep link error:", error);
    router.push("/" as any);
  }
}

/**
 * Sets up the deep link listener. Returns a cleanup function.
 */
export function attachDeepLinkHandler(): () => void {
  const subscription = Linking.addEventListener("url", (event) => {
    handleDeepLink(event.url);
  });

  // Also handle the case where the app was launched cold from a deep link
  Linking.getInitialURL().then((url) => {
    if (url) handleDeepLink(url);
  });

  return () => subscription.remove();
}