// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ─────────────────────────────────────────────────────────
// Platform-aware Auth initialization
//
// • On WEB: use getAuth() — it uses browser persistence (IndexedDB/localStorage)
//   and includes web-only APIs like signInWithPopup and signInWithRedirect.
//
// • On NATIVE: use initializeAuth() with getReactNativePersistence so the
//   session survives app restarts via AsyncStorage.
// ─────────────────────────────────────────────────────────
function createAuth() {
  if (Platform.OS === "web") {
    return getAuth(app);
  }
  // Native only:
  // @ts-ignore — getReactNativePersistence lives in the RN bundle
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getReactNativePersistence } = require("firebase/auth");
  return initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export const auth = createAuth();
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;