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
  getAccessToken,
  UserProfile,
} from "../lib/api";

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  accessToken: string | null;
  login: (token: string, user: UserProfile) => void;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setToken] = useState<string | null>(null);

  const login = useCallback((token: string, userData: UserProfile) => {
    setAccessToken(token);
    setToken(token);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    } finally {
      clearAccessToken();
      setToken(null);
      setUser(null);
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      const { accessToken: newToken } = await authApi.refresh();
      setAccessToken(newToken);
      setToken(newToken);
      const { user: profile } = await authApi.getProfile();
      setUser(profile);
    } catch {
      clearAccessToken();
      setToken(null);
      setUser(null);
    }
  }, []);

  // On mount: try to restore session via stored token or cookie-based refresh
  useEffect(() => {
    const stored = getAccessToken();
    if (stored) {
      setToken(stored);
      authApi
        .getProfile()
        .then(({ user: profile }) => setUser(profile))
        .catch(() => {
          // access token expired – try refresh
          refreshAuth();
        })
        .finally(() => setLoading(false));
    } else {
      // Try refresh token in cookie
      refreshAuth().finally(() => setLoading(false));
    }
  }, [refreshAuth]);

  return (
    <AuthContext.Provider
      value={{ user, loading, accessToken, login, logout, refreshAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
