const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ─── Token helpers ────────────────────────────────────────────────────────────
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

export function setAccessToken(token: string) {
  localStorage.setItem("accessToken", token);
}

export function clearAccessToken() {
  localStorage.removeItem("accessToken");
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include", // send cookies for refresh token
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw { status: res.status, ...(data as object) };
  }
  return data as T;
}

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authApi = {
  register: (payload: {
    email: string;
    username: string;
    password: string;
    captchaToken: string;
  }) =>
    request<{ message: string; user: { id: string; email: string; username: string } }>(
      "/api/auth/register",
      { method: "POST", body: JSON.stringify(payload) }
    ),

  login: (payload: {
    email: string;
    password: string;
    captchaToken: string;
    mfaToken?: string;
  }) =>
    request<
      | { accessToken: string; expiresIn: number; user: UserProfile }
      | { error: "MFA_REQUIRED"; tempToken: string; mfaRequired: true }
    >("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }),

  verifyEmailByCode: (payload: { email: string; code: string }) =>
    request<{ message: string }>("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  requestPasswordReset: (payload: { email: string; captchaToken: string }) =>
    request<{ message: string }>("/api/auth/request-password-reset", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  resetPassword: (token: string, payload: { password: string; captchaToken: string }) =>
    request<{ message: string }>(`/api/auth/reset-password/${token}`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  setupMfa: () =>
    request<{ secret: string; qrCode: string; backupCodes: string[] }>(
      "/api/auth/mfa/setup",
      { method: "POST" }
    ),

  confirmMfa: (payload: { token: string }) =>
    request<{ message: string; backupCodes: string[] }>("/api/auth/mfa/confirm", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  refresh: () =>
    request<{ accessToken: string; expiresIn: number }>("/api/auth/refresh", {
      method: "POST",
    }),

  logout: () =>
    request<{ message: string }>("/api/auth/logout", { method: "POST" }),

  getProfile: () => request<{ user: UserProfile }>("/api/auth/profile"),
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  createdAt?: string;
  passwordExpiresAt?: string;
}
