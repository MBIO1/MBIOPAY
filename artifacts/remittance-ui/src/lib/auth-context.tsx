import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  getMe,
  login as apiLogin,
  signup as apiSignup,
  logout as apiLogout,
  verifyEmail as apiVerifyEmail,
  resendVerification as apiResendVerification,
  type AuthUser,
  type LoginResult,
} from "./api";

export interface FullProfile extends AuthUser {
  displayName: string | null;
  avatarUrl: string | null;
  usernameSet: boolean;
  emailVerified: boolean;
  totpEnabled: boolean;
  createdAt: string;
}

export type AuthStage =
  | "idle"
  | "verify-email"
  | "totp";

export interface PendingVerification {
  email: string;
}

export interface PendingTOTP {
  email: string;
  password: string;
}

interface AuthContextValue {
  user: FullProfile | null;
  loading: boolean;
  stage: AuthStage;
  pendingEmail: string | null;
  pendingTOTP: PendingTOTP | null;
  login: (email: string, password: string, totpToken?: string) => Promise<LoginResult>;
  signup: (email: string, username: string, password: string) => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  resetStage: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<AuthStage>("idle");
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingTOTP, setPendingTOTP] = useState<PendingTOTP | null>(null);

  const fetchMe = useCallback(async () => {
    const u = await getMe();
    setUser(u as FullProfile | null);
  }, []);

  useEffect(() => {
    fetchMe().finally(() => setLoading(false));
  }, [fetchMe]);

  const login = useCallback(async (email: string, password: string, totpToken?: string): Promise<LoginResult> => {
    const result = await apiLogin(email, password, totpToken);

    if (result.requiresTOTP) {
      setPendingTOTP({ email, password });
      setStage("totp");
      return result;
    }

    if (result.user) {
      setUser(result.user as FullProfile);
      setStage("idle");
      setPendingTOTP(null);
    }

    return result;
  }, []);

  const signup = useCallback(async (email: string, username: string, password: string) => {
    const result = await apiSignup(email, username, password);
    if (result.requiresVerification) {
      setPendingEmail(result.email);
      setStage("verify-email");
    }
  }, []);

  const verifyEmail = useCallback(async (code: string) => {
    if (!pendingEmail) throw new Error("No pending verification");
    const u = await apiVerifyEmail(pendingEmail, code);
    setUser(u as FullProfile);
    setStage("idle");
    setPendingEmail(null);
  }, [pendingEmail]);

  const resendVerification = useCallback(async () => {
    if (!pendingEmail) throw new Error("No pending verification");
    await apiResendVerification(pendingEmail);
  }, [pendingEmail]);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setStage("idle");
    setPendingEmail(null);
    setPendingTOTP(null);
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchMe();
  }, [fetchMe]);

  const resetStage = useCallback(() => {
    setStage("idle");
    setPendingEmail(null);
    setPendingTOTP(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, loading, stage, pendingEmail, pendingTOTP,
      login, signup, verifyEmail, resendVerification,
      logout, refreshUser, resetStage,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
