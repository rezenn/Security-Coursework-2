"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import Cookies from "js-cookie";
import api from "@/lib/api/axios";
import { useRouter } from "next/navigation";

export type UserRole = "user" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  isEmailVerified: boolean;
  mfaEnabled: boolean;
  profile: { firstName: string; lastName: string; bio: string; avatarUrl: string | null };
}

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, captchaToken?: string, mfaToken?: string) => Promise<{ mfaRequired?: boolean; tempToken?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadUser = async () => {
    const token = Cookies.get("access_token");
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
    } catch {
      Cookies.remove("access_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUser(); }, []);

  const login = async (email: string, password: string, captchaToken?: string, mfaToken?: string) => {
    const { data } = await api.post("/auth/login", { email, password, captchaToken, mfaToken });

    if (data.mfaRequired) return { mfaRequired: true, tempToken: data.tempToken };

    // Store token
    Cookies.set("access_token", data.accessToken, { expires: 1 / 96, sameSite: "strict" });
    setUser(data.user);

    // Role-based redirect
    if (data.user.role === "admin") {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
    return {};
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch { /* ignore */ }
    Cookies.remove("access_token");
    setUser(null);
    router.push("/login");
  };

  const refreshUser = async () => {
    await loadUser();
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      refreshUser,
      isAdmin: user?.role === "admin",
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
