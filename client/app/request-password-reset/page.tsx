"use client";
import { useState } from "react";
import Link from "next/link";
import { authApi } from "../lib/api";
import { useRecaptcha } from "../hooks/useRecaptcha";
import { AuthCard, Alert, Input, Button } from "../components/AuthComponents";

export default function RequestResetPage() {
  const { getToken } = useRecaptcha();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const captchaToken = await getToken("request_password_reset");
      const res = await authApi.requestPasswordReset({ email, captchaToken });
      setSuccess(
        res.message ||
          "If that email is registered, a reset link has been sent."
      );
    } catch (err: unknown) {
      const e = err as { message?: string; error?: string };
      // Always show generic message to prevent email enumeration
      setSuccess(
        "If that email is registered, a reset link has been sent."
      );
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle="We'll send a reset link to your email"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        {!success && (
          <>
            <Input
              id="email"
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />

            <Button type="submit" loading={loading}>
              Send reset link
            </Button>
          </>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-blue-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
