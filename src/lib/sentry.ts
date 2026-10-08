import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

export function initSentry() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    console.warn("Sentry DSN missing — crash reporting disabled");
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
      if (event.exception?.values?.[0]?.value?.includes("Non-Error promise rejection")) {
        return null;
      }
      return event;
    },
  });
}

export function setSentryUser(uid: string, email?: string | null) {
  Sentry.setUser({ id: uid, email: email ?? undefined });
}

export function clearSentryUser() {
  Sentry.setUser(null);
}

export function captureError(error: Error, context?: Record<string, any>) {
  if (context) {
    Sentry.setContext("extra", context);
  }
  Sentry.captureException(error);
}