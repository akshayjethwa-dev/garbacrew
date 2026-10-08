import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import {
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { router } from "expo-router";

// Global handler — how notifications appear when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Android notification channels
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "Default",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#E91E63",
  });
  await Notifications.setNotificationChannelAsync("sos", {
    name: "Emergency SOS",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 200, 500, 200, 500],
    lightColor: "#FF0000",
    bypassDnd: true,
  });
  await Notifications.setNotificationChannelAsync("chat", {
    name: "Chat messages",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 100],
  });
}

// Permission + token registration
export async function registerForPushNotifications(
  uid: string
): Promise<string | null> {
  // Web: use the browser's FCM token instead
  if (Platform.OS === "web") {
    return null;
  }

  // Emulators can't receive FCM
  if (!Device.isDevice) {
    console.warn("Push notifications require a physical device");
    return null;
  }

  // Request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    return null;
  }

  // Get the Expo push token
  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  if (!projectId) {
    console.warn("No EAS projectId — cannot get push token");
    return null;
  }

  try {
    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const token = tokenResponse.data;

    // Persist the token so Cloud Functions can reach this device
    await setDoc(
      doc(db, "deviceTokens", uid),
      {
        uid,
        token,
        platform: Platform.OS,
        deviceName: Device.deviceName ?? "Unknown",
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return token;
  } catch (error) {
    console.error("Could not register push token:", error);
    return null;
  }
}

export async function unregisterPushNotifications(uid: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "deviceTokens", uid));
  } catch (error) {
    // Ignore
  }
}

/**
 * Called once at app boot — wires the notification-tap listener
 * to the router so tapping a notification opens the right screen.
 */
export function attachNotificationTapHandler(): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data as any;
      routeFromNotification(data);
    }
  );

  // Also handle the case where the app was launched from a notification
  Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) {
      const data = response.notification.request.content.data as any;
      routeFromNotification(data);
    }
  });

  return () => subscription.remove();
}

/**
 * Maps notification `data` to an Expo Router route.
 */
function routeFromNotification(data: any): void {
  if (!data) return;

  const { type, planId, squadId, chatId, invitationId, reportId } = data;

  try {
    switch (type) {
      case "plan_join_request":
      case "plan_join_approved":
      case "plan_join_declined":
      case "plan_created":
      case "plan_cancelled":
      case "plan_reminder":
        if (planId) router.push(`/plan/${planId}` as any);
        break;
      case "chat_message":
        if (chatId) {
          // chatId looks like "plan_abc123" or "squad_xyz789"
          if (chatId.startsWith("plan_")) {
            router.push(`/plan/chat/${chatId.replace("plan_", "")}` as any);
          } else if (chatId.startsWith("squad_")) {
            router.push(`/squad/${chatId.replace("squad_", "")}` as any);
          }
        }
        break;
      case "squad_invite":
      case "squad_archived":
        if (squadId) router.push(`/squad/${squadId}` as any);
        break;
      case "invitation":
        router.push("/invitations" as any);
        break;
      case "sos":
        if (planId) router.push(`/plan/${planId}` as any);
        break;
      case "report_resolved":
        router.push("/settings/safety" as any);
        break;
      case "rating_prompt":
        if (planId) router.push(`/plan/${planId}` as any);
        break;
      default:
        break;
    }
  } catch (error) {
    console.warn("Could not route from notification:", error);
  }
}