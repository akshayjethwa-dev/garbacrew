import { useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import { useAuth } from "../context/AuthContext";
import {
  setupNotificationChannels,
  registerForPushNotifications,
  attachNotificationTapHandler,
} from "../services/notificationService";

export function useNotifications() {
  const { user } = useAuth();
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(
    null
  );

  // Register token when user signs in
  useEffect(() => {
    if (!user) return;

    (async () => {
      await setupNotificationChannels();
      const token = await registerForPushNotifications(user.uid);
      setPermissionGranted(!!token);
    })();
  }, [user]);

  // Attach notification-tap routing
  useEffect(() => {
    const cleanup = attachNotificationTapHandler();
    return cleanup;
  }, []);

  // Update the badge count whenever the app opens
  useEffect(() => {
    if (!user) return;
    Notifications.setBadgeCountAsync(0).catch(() => {});
  }, [user]);

  return {
    permissionGranted,
    requestPermission: async () => {
      if (!user) return false;
      const token = await registerForPushNotifications(user.uid);
      setPermissionGranted(!!token);
      return !!token;
    },
  };
}