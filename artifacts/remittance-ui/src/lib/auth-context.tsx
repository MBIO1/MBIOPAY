import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMe, login as apiLogin, signup as apiSignup, logout as apiLogout, type AuthUser } from "./api";

export interface FullProfile extends AuthUser {
  displayName: string | null;
  avatarUrl: string | null;
  usernameSet: boolean;
  createdAt: string;
}

interface AuthContextValue {
  user: FullProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const u = await getMe();
    setUser(u as FullProfile | null);
  }, []);

  useEffect(() => {
    fetchMe().finally(() => setLoading(false));
  }, [fetchMe]);

  const login = useCallback(async (email: string, password: string) => {
    const u = await apiLogin(email, password);
    setUser(u as FullProfile);
  }, []);

  const signup = useCallback(async (email: string, username: string, password: string) => {
    const u = await apiSignup(email, username, password);
    setUser(u as FullProfile);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchMe();
  }, [fetchMe]);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
