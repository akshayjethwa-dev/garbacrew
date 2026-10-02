import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { GarbaCrewUser } from "../types/user";

interface AuthContextType {
  user: GarbaCrewUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
}

// ✅ Safe default — prevents "useAuth must be used within AuthProvider"
const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<GarbaCrewUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      if (!fbUser) {
        setUser(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  // Listen to the Firestore user document
  useEffect(() => {
    if (!firebaseUser) return;

    const unsubscribe = onSnapshot(
      doc(db, "users", firebaseUser.uid),
      (snap) => {
        if (snap.exists()) {
          setUser({ uid: firebaseUser.uid, ...snap.data() } as GarbaCrewUser);
        } else {
          setUser(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Firestore user snapshot error:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [firebaseUser]);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// ✅ Safe hook — never throws
export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}