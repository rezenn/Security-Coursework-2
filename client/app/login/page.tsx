"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../components/AppShell";
import {
  AuthCard,
  AuthInput,
  AuthButton,
  AuthAlert,
} from "../components/AuthComponents";
import { useRecaptcha } from "../hooks/useRecaptcha";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const { getToken } = useRecaptcha();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const captchaToken = await getToken();

      const body: any = { email, password, captchaToken };
      if (mfaRequired && tempToken) {
        body.mfaToken = mfaToken;
      }

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.status === 401 && data.error === "MFA_REQUIRED") {
        setMfaRequired(true);
        setTempToken(data.tempToken);
        setError(null);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        setError(data.error || "Login failed");
        setIsLoading(false);
        return;
      }

      localStorage.setItem("gyanKoshAccessToken", data.accessToken);
      setMessage("Login successful!");
      setTimeout(() => {
        router.push("/profile");
      }, 1000);
      setIsLoading(false);
    } catch (err) {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setMfaRequired(false);
    setTempToken(null);
    setMfaToken("");
    setError(null);
  };

  return (
    <AppShell>
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {!mfaRequired ? (
            <AuthCard title="Sign In" subtitle="Welcome back to GyanKosh">
              {message && <AuthAlert type="success" message={message} />}
              {error && <AuthAlert type="error" message={error} />}

              <form onSubmit={handleSubmit} className="space-y-5">
                <AuthInput
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <AuthInput
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <AuthButton type="submit" loading={isLoading} variant="primary">
                  Sign In
                </AuthButton>
              </form>

              <div className="mt-6 space-y-3 border-t border-slate-200 pt-6">
                <p className="text-center text-sm text-slate-600">
                  Don't have an account?{" "}
                  <a
                    href="/register"
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    Sign up
                  </a>
                </p>
                <p className="text-center text-sm text-slate-600">
                  <a
                    href="/request-password-reset"
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    Forgot password?
                  </a>
                </p>
              </div>
            </AuthCard>
          ) : (
            <AuthCard
              title="Two-Factor Authentication"
              subtitle="Enter your authentication code"
            >
              {error && <AuthAlert type="error" message={error} />}

              <form onSubmit={handleSubmit} className="space-y-5">
                <p className="text-sm text-slate-600 mb-4">
                  Enter the 6-digit code from your authenticator app or a backup
                  code.
                </p>

                <AuthInput
                  label="Authentication Code"
                  type="text"
                  placeholder="000000"
                  value={mfaToken}
                  onChange={(e) =>
                    setMfaToken(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  maxLength={6}
                  required
                />

                <AuthButton type="submit" loading={isLoading} variant="primary">
                  Verify
                </AuthButton>

                <AuthButton
                  type="button"
                  variant="secondary"
                  onClick={handleBackToLogin}
                  disabled={isLoading}
                >
                  Back
                </AuthButton>
              </form>
            </AuthCard>
          )}
        </div>
      </div>
    </AppShell>
  );
}
