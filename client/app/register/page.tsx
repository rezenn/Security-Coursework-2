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

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { getToken } = useRecaptcha();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const captchaToken = await getToken();

      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password, captchaToken }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Registration failed");
        setIsLoading(false);
        return;
      }

      setMessage(
        "Registration successful! Check your email to verify your account.",
      );
      setTimeout(() => {
        router.push("/verify");
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
          <AuthCard title="Create Account" subtitle="Join GyanKosh today">
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
                label="Username"
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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

              <p className="text-xs text-slate-500">
                Password must be at least 12 characters long with uppercase,
                lowercase, number, and special character.
              </p>

              <AuthButton type="submit" loading={isLoading} variant="primary">
                Create Account
              </AuthButton>
            </form>

            <div className="mt-6 border-t border-slate-200 pt-6">
              <p className="text-center text-sm text-slate-600">
                Already have an account?{" "}
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
