import {
  onDocumentCreated,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

const db = getFirestore();

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: "default" | null;
  priority?: "default" | "high";
  channelId?: string;
  badge?: number;
}

/**
 * Sends one or more push notifications via Expo's push API.
 * Expo handles the fan-out to APNs (iOS) and FCM (Android).
 */
async function sendExpoPush(messages: PushMessage[]): Promise<void> {
  if (messages.length === 0) return;

  // Expo Push API accepts batches of up to 100
  const chunks: PushMessage[][] = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  for (const chunk of chunks) {
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chunk),
      });

      if (!res.ok) {
        logger.error(`Expo push failed: ${res.status} ${await res.text()}`);
      }
    } catch (error) {
      logger.error("Expo push error:", error);
    }
  }
}

/**
 * Look up the Expo push tokens for a set of user IDs.
 */
async function getTokensForUsers(uids: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (uids.length === 0) return map;

  // Firestore "in" queries cap at 30 uids per query
  const chunks: string[][] = [];
  for (let i = 0; i < uids.length; i += 30) {
    chunks.push(uids.slice(i, i + 30));
  }

  for (const chunk of chunks) {
    const snap = await db
      .collection("deviceTokens")
      .where("uid", "in", chunk)
      .get();
    snap.forEach((d) => {
      const { uid, token } = d.data();
      if (uid && token) map.set(uid, token);
    });
  }
  return map;
}

/**
 * Convenience wrapper: build one push message per user and send them.
 */
async function notifyUsers(
  uids: string[],
  make: (uid: string) => Omit<PushMessage, "to">
): Promise<void> {
  const tokens = await getTokensForUsers(uids);
  const messages: PushMessage[] = [];
  tokens.forEach((token, uid) => {
    messages.push({ ...make(uid), to: token });
  });
  await sendExpoPush(messages);
}

// ─────────────────────────────────────────────────────────
// Chat message notification
// ─────────────────────────────────────────────────────────
export const onChatMessageCreated = onDocumentCreated(
  "chats/{chatId}/messages/{messageId}",
  async (event) => {
    const msg = event.data?.data();
    if (!msg) return;
    if (msg.fromUid === "system") return; // Skip system messages

    const chatId = event.params.chatId;

    const chatSnap = await db.collection("chats").doc(chatId).get();
    if (!chatSnap.exists) return;
    const chat = chatSnap.data()!;

    const recipients: string[] = (chat.participants ?? []).filter(
      (uid: string) => uid !== msg.fromUid
    );
    if (recipients.length === 0) return;

    const body =
      msg.type === "image"
        ? "📷 Photo"
        : (msg.text ?? "").length > 100
        ? (msg.text as string).slice(0, 100) + "…"
        : msg.text ?? "";

    await notifyUsers(recipients, () => ({
      title: msg.fromName ?? "New message",
      body,
      data: {
        type: "chat_message",
        chatId,
      },
      sound: "default",
      channelId: "chat",
    }));

    logger.info(
      `Chat notification sent for ${chatId} to ${recipients.length} users`
    );
  }
);

// ─────────────────────────────────────────────────────────
// Join request → notify host
// ─────────────────────────────────────────────────────────
export const onJoinRequestCreated = onDocumentUpdated(
  "plans/{planId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    const beforeReqs = (before.pendingRequests ?? []).map((r: any) => r.uid);
    const afterReqs = (after.pendingRequests ?? []).map((r: any) => r.uid);
    if (afterReqs.length <= beforeReqs.length) return;

    const newRequesters = afterReqs.filter(
      (u: string) => !beforeReqs.includes(u)
    );
    if (newRequesters.length === 0) return;

    // Notify the host that a new request came in
    const hostUid = after.hostUid;
    const firstRequester = (after.pendingRequests ?? []).find(
      (r: any) => r.uid === newRequesters[0]
    );

    await notifyUsers([hostUid], () => ({
      title: "New join request",
      body: `${firstRequester?.name ?? "Someone"} wants to join "${
        after.title
      }"`,
      data: {
        type: "plan_join_request",
        planId: event.params.planId,
      },
      sound: "default",
    }));
  }
);

// ─────────────────────────────────────────────────────────
// SOS → notify everyone in the chat
// ─────────────────────────────────────────────────────────
export const onSOSNotification = onDocumentCreated(
  "sosEvents/{sosId}",
  async (event) => {
    const sos = event.data?.data();
    if (!sos) return;

    let recipients: string[] = [];

    if (sos.chatId) {
      const chatSnap = await db.collection("chats").doc(sos.chatId).get();
      if (chatSnap.exists) {
        recipients = (chatSnap.data()?.participants ?? []).filter(
          (uid: string) => uid !== sos.uid
        );
      }
    }

    if (recipients.length === 0) return;

    await notifyUsers(recipients, () => ({
      title: "🚨 SOS Alert",
      body: `${sos.userName} triggered an emergency. Tap to open the chat.`,
      data: {
        type: "sos",
        chatId: sos.chatId,
        planId: sos.planId,
      },
      sound: "default",
      priority: "high",
      channelId: "sos",
    }));

    logger.info(`SOS notification sent to ${recipients.length} users`);
  }
);

// ─────────────────────────────────────────────────────────
// Invitation → notify invitee
// ─────────────────────────────────────────────────────────
export const onInvitationCreated = onDocumentCreated(
  "invitations/{invitationId}",
  async (event) => {
    const inv = event.data?.data();
    if (!inv) return;

    await notifyUsers([inv.invitedUid], () => ({
      title: "New invitation",
      body: `${inv.inviterName} invited you to "${inv.targetTitle}"`,
      data: {
        type: "invitation",
        invitationId: event.params.invitationId,
      },
      sound: "default",
    }));
  }
);

// ─────────────────────────────────────────────────────────
// Plan reminders (24h + 2h before start)
// ─────────────────────────────────────────────────────────
export const sendPlanReminders = onSchedule(
  {
    schedule: "every 30 minutes",
    timeZone: "Asia/Kolkata",
    region: "asia-south1",
  },
  async () => {
    const now = Date.now();
    const window24Start = new Date(now + 23.5 * 60 * 60 * 1000);
    const window24End = new Date(now + 24 * 60 * 60 * 1000);
    const window2Start = new Date(now + 1.75 * 60 * 60 * 1000);
    const window2End = new Date(now + 2 * 60 * 60 * 1000);

    const windows: Array<[number, Date, Date]> = [
      [24, window24Start, window24End],
      [2, window2Start, window2End],
    ];

    for (const [hours, start, end] of windows) {
      const snap = await db
        .collection("plans")
        .where("status", "in", ["open", "full"])
        .where("startTime", ">=", Timestamp.fromDate(start))
        .where("startTime", "<=", Timestamp.fromDate(end))
        .get();

      for (const planDoc of snap.docs) {
        const plan = planDoc.data();
        const reminderField = `reminded${hours}h`;
        if (plan[reminderField]) continue;

        const recipients: string[] = [
          plan.hostUid,
          ...(plan.participants ?? []),
        ].filter(Boolean);

        await notifyUsers(recipients, () => ({
          title: `⏰ Plan starts in ${hours}h`,
          body: `"${plan.title}" at ${plan.locationName}`,
          data: {
            type: "plan_reminder",
            planId: planDoc.id,
          },
          sound: "default",
        }));

        await planDoc.ref.update({ [reminderField]: true });
      }
    }
  }
);