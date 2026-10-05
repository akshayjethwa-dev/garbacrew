import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot, Unsubscribe } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { GarbaCrewUser } from "../types/user";

interface AuthContextType {
  user: GarbaCrewUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<GarbaCrewUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      console.log("🔥 onAuthStateChanged:", fbUser?.uid ?? "null");
      setFirebaseUser(fbUser);

      if (!fbUser) {
        // Immediately clear user on sign out
        setUser(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;

    let unsubDoc: Unsubscribe | null = null;

    unsubDoc = onSnapshot(
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

    return () => {
      if (unsubDoc) unsubDoc();
    };
  }, [firebaseUser]);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}