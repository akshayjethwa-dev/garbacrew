import { useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { useAuth } from "../context/AuthContext";
import {
  setupNotificationChannels,
  registerForPushNotifications,
  attachNotificationTapHandler,
} from "../services/notificationService";

const isWeb = Platform.OS === "web";

export function useNotifications() {
  const { user } = useAuth();
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(
    null
  );

  // Register token when user signs in (native only)
  useEffect(() => {
    if (isWeb) return;
    if (!user) return;

    (async () => {
      try {
        await setupNotificationChannels();
        const token = await registerForPushNotifications(user.uid);
        setPermissionGranted(!!token);
      } catch (error) {
        console.warn("[useNotifications] Registration failed:", error);
        setPermissionGranted(false);
      }
    })();
  }, [user]);

  // Attach notification-tap routing (native only)
  useEffect(() => {
    if (isWeb) return;
    const cleanup = attachNotificationTapHandler();
    return cleanup;
  }, []);

  // Clear the badge when the app opens (native only)
  useEffect(() => {
    if (isWeb) return;
    if (!user) return;
    Notifications.setBadgeCountAsync(0).catch(() => {});
  }, [user]);

  return {
    permissionGranted,
    requestPermission: async () => {
      if (isWeb) return false;
      if (!user) return false;
      try {
        const token = await registerForPushNotifications(user.uid);
        setPermissionGranted(!!token);
        return !!token;
      } catch {
        return false;
      }
    },
  };
}