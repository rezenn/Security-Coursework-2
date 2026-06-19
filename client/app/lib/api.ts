const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

let _accessToken: string | null = null;

export function getAccessToken(): string | null {
  return _accessToken;
}
export function setAccessToken(token: string) {
  _accessToken = token;
}
export function clearAccessToken() {
  _accessToken = null;
}

let _refreshing: Promise<string> | null = null;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (_accessToken) headers["Authorization"] = `Bearer ${_accessToken}`;

  let res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });


  if (res.status === 401 && path !== "/api/auth/refresh") {
    const cloned = res.clone();
    const peek = (await cloned.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    if (peek.mfaRequired === true || peek.error === "MFA_REQUIRED") {
      throw { status: 401, ...peek };
    }

    try {
      if (!_refreshing) {
        _refreshing = authApi
          .refresh()
          .then((d) => {
            setAccessToken(d.accessToken);
            return d.accessToken;
          })
          .finally(() => {
            _refreshing = null;
          });
      }
      const newToken = await _refreshing;
      headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
        credentials: "include",
      });
    } catch {
      clearAccessToken();
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, ...(data as object) };
  return data as T;
}

export const authApi = {
  register: (payload: {
    email: string;
    username: string;
    password: string;
    captchaToken: string;
  }) =>
    request<{ message: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (payload: {
    email: string;
    password: string;
    captchaToken: string;
    mfaToken?: string;
  }) =>
    request<
      | { accessToken: string; expiresIn: string; user: UserProfile }
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

  resetPassword: (
    token: string,
    payload: { password: string; captchaToken: string },
  ) =>
    request<{ message: string }>(`/api/auth/reset-password/${token}`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  resetPasswordWithCode: (payload: {
    email: string;
    code: string;
    password: string;
    captchaToken: string;
  }) =>
    request<{ message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  setupMfa: () =>
    request<{ qrCodeDataUrl: string; backupCodes: string[]; message: string }>(
      "/api/auth/mfa/setup",
      { method: "POST" },
    ),

  confirmMfa: (payload: { token: string }) =>
    request<{ message: string }>("/api/auth/mfa/confirm", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  refresh: () =>
    request<{ accessToken: string; expiresIn: string }>("/api/auth/refresh", {
      method: "POST",
    }),

  logout: () =>
    request<{ message: string }>("/api/auth/logout", { method: "POST" }),

  getProfile: () => request<UserProfile>("/api/profile", { method: "GET" }),
};

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  role: string;
  isEmailVerified: boolean;
  mfaEnabled: boolean;
  createdAt?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatarUrl?: string;
  };
}
