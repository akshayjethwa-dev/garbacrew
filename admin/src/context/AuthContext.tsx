import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  User,
} from "firebase/auth";
import { auth, ADMIN_EMAILS } from "../lib/firebase";
import { adminVerify, adminWhoami } from "../lib/api";

interface AuthState {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthState>({
  user: null,
  loading: true,
  isAdmin: false,
  authError: null,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthError(null);

      if (!u) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const email = (u.email ?? "").toLowerCase();

      // Client-side fast check against VITE_ADMIN_EMAILS
      if (!ADMIN_EMAILS.includes(email)) {
        setAuthError(
          `Your email (${email}) is not in VITE_ADMIN_EMAILS. Add it to admin/.env and restart the dev server.`
        );
        await fbSignOut(auth);
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Server-side authoritative check
      try {
        await adminVerify();
        setIsAdmin(true);
      } catch (err: any) {
        // Enhance the error with a diagnostic call
        let diagnostic = "";
        try {
          const info = await adminWhoami();
          diagnostic = `\n\nServer sees:\n  email: ${info.email ?? "(none)"}\n  allowed: ${info.allowedEmails.join(", ") || "(empty)"}`;
        } catch {
          diagnostic = "\n\nCould not reach adminWhoami — the function may not be deployed.";
        }

        setAuthError(
          (err.message ?? "Server verification failed") + diagnostic
        );
        await fbSignOut(auth);
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = async (email: string, password: string) => {
    setAuthError(null);
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    await fbSignOut(auth);
  };

  return (
    <Ctx.Provider
      value={{ user, loading, isAdmin, authError, signIn, signOut }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);