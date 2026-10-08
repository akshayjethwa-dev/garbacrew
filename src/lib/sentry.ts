import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";
import { Platform } from "react-native";

let initialized = false;

/**
 * Basic sanity check for a Sentry DSN.
 * A real DSN looks like: https://<32+ hex chars>@o12345.ingest.sentry.io/1234567
 */
function isValidDsn(dsn: string | undefined): boolean {
  if (!dsn) return false;
  // Reject the obvious placeholder values
  if (
    dsn.includes("your-dsn") ||
    dsn.includes("your-project-id") ||
    dsn === "undefined" ||
    dsn === "null"
  ) {
    return false;
  }
  // Basic structural check
  try {
    const url = new URL(dsn);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    if (!url.username) return false;
    if (!url.hostname.includes(".")) return false;
    return true;
  } catch {
    return false;
  }
}

export function initSentry() {
  if (initialized) return;

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

  // Skip on web — Sentry RN SDK requires native runtime
  if (Platform.OS === "web") {
    if (__DEV__) {
      console.log("[Sentry] Skipped on web platform");
    }
    initialized = true;
    return;
  }

  // Skip if DSN is missing or a placeholder
  if (!isValidDsn(dsn)) {
    if (__DEV__) {
      console.log(
        "[Sentry] Skipped — no valid DSN set (EXPO_PUBLIC_SENTRY_DSN missing or placeholder)"
      );
    }
    initialized = true;
    return;
  }

  Sentry.init({
    dsn,
    environment:
      process.env.EXPO_PUBLIC_APP_ENV ??
      (__DEV__ ? "development" : "production"),
    // Sample 100% of crashes, 10% of transactions
    tracesSampleRate: 0.1,
    // Don't send events in dev to avoid noise
    enabled: !__DEV__,
    // Attach the app version from app.json
    release: `garbacrew@${Constants.expoConfig?.version ?? "1.0.0"}`,
    attachStacktrace: true,
    beforeSend(event) {
      // Filter out harmless errors
      const msg = event.exception?.values?.[0]?.value ?? "";
      if (msg.includes("Non-Error promise rejection")) return null;
      return event;
    },
  });

  initialized = true;
}

export function setSentryUser(uid: string, email?: string | null) {
  if (!initialized) return;
  try {
    Sentry.setUser({ id: uid, email: email ?? undefined });
  } catch {
    // Sentry may not be initialized
  }
}

export function clearSentryUser() {
  if (!initialized) return;
  try {
    Sentry.setUser(null);
  } catch {
    // Sentry may not be initialized
  }
}

export function captureError(error: Error, context?: Record<string, any>) {
  if (!initialized) return;
  try {
    if (context) Sentry.setContext("extra", context);
    Sentry.captureException(error);
  } catch {
    // Ignore
  }
}