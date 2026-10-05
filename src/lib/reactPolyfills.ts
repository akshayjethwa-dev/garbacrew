// src/lib/reactPolyfills.ts
import * as React from "react";

// React 19.1+ exposes captureOwnerStack in development mode only.
// Expo Go may bundle a React version that doesn't include it.
// This polyfill provides a safe fallback so React's error overlay
// doesn't crash when it tries to use the missing function.
if (__DEV__ && typeof (React as any).captureOwnerStack !== "function") {
  (React as any).captureOwnerStack = () => null;
}