// src/config/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
// @ts-ignore — getReactNativePersistence exists at runtime but is not in web types
import { getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Fail fast if any required config is missing.
// This prevents cryptic Firebase errors at runtime.
const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingKeys.length > 0) {
  throw new Error(
    `Missing Firebase config: ${missingKeys.join(', ')}. ` +
      `Check your .env file and restart Expo with "npx expo start --clear".`
  );
}

// Reuse existing app on Fast Refresh to avoid duplicate initialization errors
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firebase Auth: use React Native persistence so users stay logged in
let auth: ReturnType<typeof getAuth>;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // If already initialized (Fast Refresh), fall back to getAuth
  auth = getAuth(app);
}

export const db = getFirestore(app);
export const storage = getStorage(app);
export { auth };