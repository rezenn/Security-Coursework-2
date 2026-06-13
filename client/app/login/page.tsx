"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "../lib/api";
import { useRecaptcha } from "../hooks/useRecaptcha";
import { useAuth } from "../hooks/useAuth";
import {
  AuthCard,
  Alert,
  Input,
  PasswordInput,
  Button,
} from "../components/AuthComponents";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { getToken } = useRecaptcha();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const captchaToken = await getToken("login");
      const res = await authApi.login({ email, password, captchaToken });

      if ("mfaRequired" in res && res.mfaRequired) {
        // Store temp token for MFA page
        sessionStorage.setItem("mfaTempToken", res.tempToken);
        sessionStorage.setItem("mfaEmail", email);
        router.push("/mfa");
        return;
      }

      if ("accessToken" in res) {
        login(res.accessToken, res.user);
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const e = err as { message?: string; error?: string; status?: number };

      if (e.status === 403 && e.error?.includes("verify")) {
        // Email not verified – go to verify page
        sessionStorage.setItem("pendingEmail", email);
        router.push("/verify");
        return;
      }

      setError(
        e.error || e.message || "Login failed. Check your credentials."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Sign in"
      subtitle="Welcome back to GyanKosh"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} />}

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

        <PasswordInput
          id="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your password"
          required
          autoComplete="current-password"
        />

        <div className="flex justify-end">
          <Link
            href="/request-password-reset"
            className="text-sm text-blue-600 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={loading}>
          Sign in
        </Button>

        <p className="text-center text-xs text-gray-400">
          Protected by reCAPTCHA.{" "}
          <a
            href="https://policies.google.com/privacy"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            Privacy
          </a>{" "}
          &amp;{" "}
          <a
            href="https://policies.google.com/terms"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            Terms
          </a>
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-blue-600 hover:underline">
          Create one
        </Link>
      </p>
    </AuthCard>
  );
}
