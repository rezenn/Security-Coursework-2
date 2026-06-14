"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  authApi,
  setAccessToken,
  clearAccessToken,
  UserProfile,
} from "../lib/api";

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const login = useCallback((token: string, userData: UserProfile) => {
    setAccessToken(token);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore – clear locally regardless */
    } finally {
      clearAccessToken();
      setUser(null);
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      const { accessToken: newToken } = await authApi.refresh();
      setAccessToken(newToken);
      // Fetch profile to confirm the token is valid
      const profile = await authApi.getProfile();
      setUser(profile);
    } catch {
      clearAccessToken();
      setUser(null);
    }
  }, []);

  // On mount: attempt session restore via httpOnly refresh cookie
  useEffect(() => {
    refreshAuth().finally(() => setLoading(false));
  }, [refreshAuth]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
