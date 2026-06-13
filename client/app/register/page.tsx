"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "../lib/api";
import { useRecaptcha } from "../hooks/useRecaptcha";
import {
  AuthCard,
  Alert,
  Input,
  PasswordInput,
  PasswordStrength,
  Button,
} from "../components/AuthComponents";

export default function RegisterPage() {
  const router = useRouter();
  const { getToken } = useRecaptcha();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validate = () => {
    if (password !== confirm) return "Passwords do not match.";
    if (password.length < 12) return "Password must be at least 12 characters.";
    if (!/[A-Z]/.test(password)) return "Password needs an uppercase letter.";
    if (!/[a-z]/.test(password)) return "Password needs a lowercase letter.";
    if (!/[0-9]/.test(password)) return "Password needs a number.";
    if (!/[^A-Za-z0-9]/.test(password)) return "Password needs a special character.";
    return null;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const captchaToken = await getToken("register");
      const res = await authApi.register({ email, username, password, captchaToken });
      setSuccess(
        res.message ||
          "Account created! Check your email for a verification code."
      );
      // Store email for verify page
      sessionStorage.setItem("pendingEmail", email);
      setTimeout(() => router.push("/verify"), 2000);
    } catch (err: unknown) {
      const e = err as { message?: string; error?: string; errors?: { msg: string }[] };
      if (e.errors?.length) {
        setError(e.errors.map((x) => x.msg).join(", "));
      } else {
        setError(e.error || e.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Create account"
      subtitle="Join GyanKosh today"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        <Input
          id="username"
          label="Username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="johndoe"
          required
          autoComplete="username"
        />

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

        <div>
          <PasswordInput
            id="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 12 characters"
            required
            autoComplete="new-password"
          />
          <PasswordStrength password={password} />
        </div>

        <PasswordInput
          id="confirm"
          label="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repeat password"
          required
          autoComplete="new-password"
        />

        <Button type="submit" loading={loading}>
          Create account
        </Button>

        <p className="text-center text-xs text-gray-400">
          Protected by reCAPTCHA.{" "}
          <a href="https://policies.google.com/privacy" className="underline" target="_blank" rel="noreferrer">
            Privacy
          </a>{" "}
          &amp;{" "}
          <a href="https://policies.google.com/terms" className="underline" target="_blank" rel="noreferrer">
            Terms
          </a>
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-blue-600 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
