"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "../lib/api";
import {
  AuthCard,
  Alert,
  Input,
  OTPInput,
  Button,
  Divider,
} from "../components/AuthComponents";

export default function VerifyPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("pendingEmail");
    if (stored) setEmail(stored);
  }, []);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await authApi.verifyEmailByCode({ email, code });
      setSuccess(res.message || "Email verified! You can now sign in.");
      sessionStorage.removeItem("pendingEmail");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: unknown) {
      const e = err as { message?: string; error?: string };
      setError(e.error || e.message || "Verification failed. Check the code and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Verify your email"
      subtitle="Enter the 6-digit code sent to your inbox"
    >
      <form onSubmit={handleVerify} className="space-y-5">
        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        {!email && (
          <Input
            id="email"
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        )}

        {email && (
          <p className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Code sent to <strong>{email}</strong>
          </p>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-700">Verification code</p>
          <OTPInput value={code} onChange={setCode} length={6} />
        </div>

        <Button type="submit" loading={loading} disabled={code.length !== 6}>
          Verify email
        </Button>

        <Divider label="or" />

        <p className="text-center text-sm text-gray-500">
          Didn&apos;t get the email?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
