import {
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  GoogleAuthProvider,
  signInWithCredential as signInWithGoogleCredential,
  Auth,
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { GarbaCrewUser } from "../types/user";

export interface PhoneAuthResult {
  verificationId: string;
  success: boolean;
  error?: string;
}

/**
 * Send OTP to a phone number.
 * Uses Firebase Phone Auth with reCAPTCHA verifier.
 */
export async function sendOTP(
  phoneNumber: string, // E.164 format: +919876543210
  recaptchaVerifier: any
): Promise<PhoneAuthResult> {
  try {
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      recaptchaVerifier
    );
    return {
      verificationId: confirmationResult.verificationId,
      success: true,
    };
  } catch (error: any) {
    console.error("Phone auth error:", error);
    return {
      verificationId: "",
      success: false,
      error: getPhoneAuthError(error.code),
    };
  }
}

/**
 * Verify OTP code and sign in.
 */
export async function verifyOTP(
  verificationId: string,
  code: string
): Promise<{ user: GarbaCrewUser | null; isNewUser: boolean; error?: string }> {
  try {
    const credential = PhoneAuthProvider.credential(verificationId, code);
    const userCredential = await signInWithCredential(auth, credential);
    const { user } = userCredential;

    // Check if user doc exists
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data() as GarbaCrewUser;
      return {
        user: { ...userData, uid: user.uid },
        isNewUser: false,
      };
    }

    // Create new user doc
    const newUser: GarbaCrewUser = {
      uid: user.uid,
      phone: user.phoneNumber,
      email: null,
      displayName: null,
      photoUrl: null,
      createdAt: serverTimestamp() as any,
      profileComplete: false,
      isVerified: false,
      selfieVerified: false,
      profileScore: 0,
      hostScore: 50,
      guestScore: 50,
      trustBalance: 50,
    };

    await setDoc(userDocRef, newUser);

    return { user: newUser, isNewUser: true };
  } catch (error: any) {
    console.error("OTP verification error:", error);
    return {
      user: null,
      isNewUser: false,
      error: getOTPError(error.code),
    };
  }
}

/**
 * Google Sign-In via credential (idToken from expo-auth-session).
 */
export async function signInWithGoogle(idToken: string): Promise<{
  user: GarbaCrewUser | null;
  isNewUser: boolean;
  needsPhone: boolean;
  error?: string;
}> {
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithGoogleCredential(auth, credential);
    const { user } = userCredential;

    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data() as GarbaCrewUser;
      return {
        user: { ...userData, uid: user.uid },
        isNewUser: false,
        needsPhone: !userData.phone,
      };
    }

    // New user via Google — phone is required for one-account enforcement
    const newUser: GarbaCrewUser = {
      uid: user.uid,
      phone: null,
      email: user.email,
      displayName: user.displayName,
      photoUrl: user.photoURL,
      createdAt: serverTimestamp() as any,
      profileComplete: false,
      isVerified: false,
      selfieVerified: false,
      profileScore: 0,
      hostScore: 50,
      guestScore: 50,
      trustBalance: 50,
    };

    await setDoc(userDocRef, newUser);

    return { user: newUser, isNewUser: true, needsPhone: true };
  } catch (error: any) {
    console.error("Google sign-in error:", error);
    return {
      user: null,
      isNewUser: false,
      needsPhone: false,
      error: "Google sign-in failed. Please try again.",
    };
  }
}

// ─── Error message helpers ───

function getPhoneAuthError(code: string): string {
  const map: Record<string, string> = {
    "auth/invalid-phone-number": "Invalid phone number. Please check and try again.",
    "auth/too-many-requests": "Too many attempts. Please wait 5 minutes.",
    "auth/quota-exceeded": "SMS quota exceeded. Try again later.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/captcha-check-failed": "Verification failed. Please retry.",
  };
  return map[code] || "Failed to send OTP. Please try again.";
}

function getOTPError(code: string): string {
  const map: Record<string, string> = {
    "auth/invalid-verification-code": "Incorrect OTP. Please check and re-enter.",
    "auth/code-expired": "OTP expired. Please request a new one.",
    "auth/too-many-requests": "Too many attempts. Please wait 5 minutes.",
    "auth/network-request-failed": "Network error. Check your connection.",
  };
  return map[code] || "Verification failed. Please try again.";
}