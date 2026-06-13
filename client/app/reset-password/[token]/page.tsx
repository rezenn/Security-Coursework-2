"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { authApi } from "../../lib/api";
import { useRecaptcha } from "../../hooks/useRecaptcha";
import {
  AuthCard,
  Alert,
  PasswordInput,
  PasswordStrength,
  Button,
} from "../../components/AuthComponents";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;
  const { getToken } = useRecaptcha();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validate = () => {
    if (password !== confirm) return "Passwords do not match.";
    if (password.length < 12) return "Password must be at least 12 characters.";
    if (!/[A-Z]/.test(password)) return "Needs an uppercase letter.";
    if (!/[a-z]/.test(password)) return "Needs a lowercase letter.";
    if (!/[0-9]/.test(password)) return "Needs a number.";
    if (!/[^A-Za-z0-9]/.test(password)) return "Needs a special character.";
    return null;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);
    try {
      const captchaToken = await getToken("reset_password");
      const res = await authApi.resetPassword(token, { password, captchaToken });
      setSuccess(res.message || "Password updated! You can now sign in.");
      setTimeout(() => router.push("/login"), 2000);
    } catch (e: unknown) {
      const err = e as { message?: string; error?: string };
      setError(err.error || err.message || "Reset failed. The link may have expired.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthCard title="Invalid link">
        <Alert type="error" message="This reset link is invalid or has expired." />
        <Button className="mt-4" onClick={() => router.push("/request-password-reset")}>
          Request a new link
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Set new password"
      subtitle="Choose a strong password for your account"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        {!success && (
          <>
            <div>
              <PasswordInput
                id="password"
                label="New password"
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
              label="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
              required
              autoComplete="new-password"
            />

            <Button type="submit" loading={loading}>
              Update password
            </Button>
          </>
        )}
      </form>
    </AuthCard>
  );
}
