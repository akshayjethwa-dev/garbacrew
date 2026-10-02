import {
  PhoneAuthProvider,
  signInWithCredential,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { GarbaCrewUser } from "../types/user";

/**
 * Verify OTP using the verificationId returned by the reCAPTCHA modal.
 */
export async function verifyOTP(
  verificationId: string,
  code: string
): Promise<{ user: GarbaCrewUser | null; isNewUser: boolean; error?: string }> {
  try {
    const credential = PhoneAuthProvider.credential(verificationId, code);
    const userCredential = await signInWithCredential(auth, credential);
    const { user } = userCredential;

    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data() as GarbaCrewUser;
      return { user: { ...userData, uid: user.uid }, isNewUser: false };
    }

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
    const userCredential = await signInWithCredential(auth, credential);
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

function getOTPError(code: string): string {
  const map: Record<string, string> = {
    "auth/invalid-verification-code": "Incorrect OTP. Please check and re-enter.",
    "auth/code-expired": "OTP expired. Please request a new one.",
    "auth/too-many-requests": "Too many attempts. Please wait 5 minutes.",
    "auth/network-request-failed": "Network error. Check your connection.",
  };
  return map[code] || "Verification failed. Please try again.";
}