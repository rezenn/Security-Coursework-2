"use client";

import { useState } from "react";
import AppShell from "../components/AppShell";
import {
  AuthCard,
  AuthInput,
  AuthButton,
  AuthAlert,
} from "../components/AuthComponents";
import { useRecaptcha } from "../hooks/useRecaptcha";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function RequestPasswordResetPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { getToken } = useRecaptcha();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const captchaToken = await getToken();

      const response = await fetch(
        `${API_URL}/api/auth/request-password-reset`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, captchaToken }),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Unable to send password reset link.");
        setIsLoading(false);
        return;
      }

      setSubmitted(true);
      setMessage(
        "If your email exists, a password reset link has been sent. Check your email in a few minutes.",
      );
      setEmail("");
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
          <AuthCard title="Forgot Password" subtitle="Reset your password">
            {message && <AuthAlert type="success" message={message} />}
            {error && <AuthAlert type="error" message={error} />}

            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <p className="text-sm text-slate-600">
                  Enter your email address and we'll send you a link to reset
                  your password.
                </p>

                <AuthInput
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <AuthButton type="submit" loading={isLoading} variant="primary">
                  Send Reset Link
                </AuthButton>
              </form>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  If your email exists in our system, you'll receive a password
                  reset link shortly.
                </p>
                <AuthButton
                  variant="secondary"
                  onClick={() => (window.location.href = "/login")}
                >
                  Back to Login
                </AuthButton>
              </div>
            )}

            <div className="mt-6 border-t border-slate-200 pt-6">
              <p className="text-center text-sm text-slate-600">
                Remember your password?{" "}
                <a
                  href="/login"
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  Sign in
                </a>
              </p>
            </div>
          </AuthCard>
        </div>
      </div>
    </AppShell>
  );
}
