import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { db, storage } from "../lib/firebase";
import { GarbaCrewUser } from "../types/user";
import { ChatMessage } from "../types/plan";

/**
 * Subscribe to messages in a chat (newest last).
 */
export function subscribeToMessages(
  chatId: string,
  onMessages: (msgs: ChatMessage[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "asc"),
    limit(500)
  );
  return onSnapshot(q, (snap) => {
    onMessages(
      snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage))
    );
  });
}

/**
 * Send a text message.
 */
export async function sendTextMessage(
  chatId: string,
  me: GarbaCrewUser,
  text: string
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;

  await addDoc(collection(db, "chats", chatId, "messages"), {
    fromUid: me.uid,
    fromName: me.name ?? "Someone",
    fromPhotoUrl: me.photoUrl ?? null,
    type: "text",
    text: trimmed,
    imageUrl: null,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "chats", chatId), {
    lastMessage:
      trimmed.length > 60 ? trimmed.slice(0, 60) + "…" : trimmed,
    lastMessageAt: serverTimestamp(),
  });
}

/**
 * Send an image message.
 */
export async function sendImageMessage(
  chatId: string,
  me: GarbaCrewUser,
  localUri: string
): Promise<void> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const path = `chats/${chatId}/${me.uid}/${Date.now()}.jpg`;
  const ref = storageRef(storage, path);
  await uploadBytes(ref, blob, { contentType: "image/jpeg" });
  const url = await getDownloadURL(ref);

  await addDoc(collection(db, "chats", chatId, "messages"), {
    fromUid: me.uid,
    fromName: me.name ?? "Someone",
    fromPhotoUrl: me.photoUrl ?? null,
    type: "image",
    text: "",
    imageUrl: url,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "chats", chatId), {
    lastMessage: "📷 Photo",
    lastMessageAt: serverTimestamp(),
  });
}

/**
 * Send a system message (used by Cloud Functions and by approval flow).
 */
export async function sendSystemMessage(
  chatId: string,
  text: string
): Promise<void> {
  await addDoc(collection(db, "chats", chatId, "messages"), {
    fromUid: "system",
    fromName: "GarbaCrew",
    fromPhotoUrl: null,
    type: "system",
    text,
    imageUrl: null,
    createdAt: serverTimestamp(),
  });
}

/**
 * Typing indicator.
 */
export async function setTyping(
  chatId: string,
  me: GarbaCrewUser,
  isTyping: boolean
): Promise<void> {
  const ref = doc(db, "chats", chatId, "typing", me.uid);
  if (isTyping) {
    await setDoc(ref, {
      uid: me.uid,
      name: me.name ?? "Someone",
      at: serverTimestamp(),
    });
  } else {
    await deleteDoc(ref).catch(() => {});
  }
}

/**
 * Subscribe to typing users (excluding me, last 6 seconds).
 */
export function subscribeToTyping(
  chatId: string,
  myUid: string,
  onTyping: (names: string[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, "chats", chatId, "typing"), (snap) => {
    const now = Date.now();
    const names: string[] = [];
    snap.docs.forEach((d) => {
      const data = d.data();
      if (data.uid === myUid) return;
      const at = (data.at as Timestamp)?.toMillis?.() ?? 0;
      if (now - at < 6000) {
        names.push(data.name);
      }
    });
    onTyping(names);
  });
}

/**
 * Mark messages as read up to now.
 */
export async function markChatRead(
  chatId: string,
  uid: string
): Promise<void> {
  await setDoc(
    doc(db, "chats", chatId, "reads", uid),
    { uid, lastReadAt: serverTimestamp() },
    { merge: true }
  );
}

/**
 * Subscribe to read receipts (map of uid → last read timestamp).
 */
export function subscribeToReads(
  chatId: string,
  onReads: (reads: Record<string, number>) => void
): Unsubscribe {
  return onSnapshot(collection(db, "chats", chatId, "reads"), (snap) => {
    const out: Record<string, number> = {};
    snap.docs.forEach((d) => {
      const data = d.data();
      const at = (data.lastReadAt as Timestamp)?.toMillis?.() ?? 0;
      out[data.uid] = at;
    });
    onReads(out);
  });
}