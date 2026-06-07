"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/AppShell";
import {
  AuthCard,
  AuthInput,
  AuthButton,
  AuthAlert,
} from "../../components/AuthComponents";
import { useRecaptcha } from "../../hooks/useRecaptcha";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ResetPasswordPage({
  params,
}: {
  params: { token?: string };
}) {
  const router = useRouter();
  const token = params.token;
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"ready" | "invalid" | "success">(
    "ready",
  );
  const [isLoading, setIsLoading] = useState(false);
  const { getToken } = useRecaptcha();

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setError("Reset token is missing.");
    }
  }, [token]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setError("Reset token is required.");
      return;
    }
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const captchaToken = await getToken();

      const response = await fetch(
        `${API_URL}/api/auth/reset-password/${token}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password, captchaToken }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to reset password.");
        setIsLoading(false);
        return;
      }

      setStatus("success");
      setMessage("Password updated successfully!");
      setPassword("");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
      setIsLoading(false);
    } catch (err) {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {status === "invalid" ? (
            <AuthCard
              title="Invalid Reset Link"
              subtitle="The link has expired or is invalid"
            >
              <AuthAlert
                type="error"
                message="Please request a new password reset link."
              />
              <AuthButton
                variant="secondary"
                onClick={() => router.push("/request-password-reset")}
                className="mt-4"
              >
                Request New Link
              </AuthButton>
            </AuthCard>
          ) : status === "success" ? (
            <AuthCard
              title="Password Reset"
              subtitle="Your password has been updated"
            >
              <AuthAlert
                type="success"
                message={message || "Password updated successfully!"}
              />
              <div className="mt-6 text-center">
                <p className="text-sm text-slate-600">
                  Redirecting to login...
                </p>
              </div>
            </AuthCard>
          ) : (
            <AuthCard title="Reset Password" subtitle="Enter your new password">
              {error && <AuthAlert type="error" message={error} />}

              <form onSubmit={handleSubmit} className="space-y-5">
                <AuthInput
                  label="New Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <p className="text-xs text-slate-500">
                  Password must be at least 12 characters long with uppercase,
                  lowercase, number, and special character.
                </p>

                <AuthButton type="submit" loading={isLoading} variant="primary">
                  Reset Password
                </AuthButton>
              </form>

              <div className="mt-6 border-t border-slate-200 pt-6">
                <p className="text-center text-sm text-slate-600">
                  <a
                    href="/login"
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    Back to login
                  </a>
                </p>
              </div>
            </AuthCard>
          )}
        </div>
      </div>
    </AppShell>
  );
}
