"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/app/lib/api";
import { useRecaptcha } from "@/app/hooks/useRecaptcha";

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { getToken } = useRecaptcha();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 12) {
      setError("Password must be at least 12 characters.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const captchaToken = await getToken("reset_password");
      await authApi.resetPassword(token, { password, captchaToken });
      router.push("/login?reset=1");
    } catch (e: unknown) {
      const err = e as { error?: string; message?: string; details?: unknown };
      const msg = err.error || err.message || "";
      if (
        msg.toLowerCase().includes("reuse") ||
        msg.toLowerCase().includes("history")
      ) {
        setError(
          "You cannot reuse a recent password for this account. Please choose a new password you haven't used before.",
        );
      } else if (
        msg.toLowerCase().includes("requirement") ||
        msg.toLowerCase().includes("policy") ||
        err.details
      ) {
        setError(
          "Your new password doesn't meet the requirements. It needs 12+ characters, uppercase, lowercase, a number, and a special character.",
        );
      } else {
        setError(
          msg || "Reset failed. The link may have expired — request a new one.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const requirements = [
    { text: "12+ characters", met: password.length >= 12 },
    { text: "Uppercase letter", met: /[A-Z]/.test(password) },
    { text: "Number", met: /[0-9]/.test(password) },
    { text: "Special character", met: /[^a-zA-Z0-9]/.test(password) },
    {
      text: "Passwords match",
      met: confirm.length > 0 && password === confirm,
    },
  ];

  return (
    <div className="w-full max-w-md px-4">
      <div
        style={{
          background: "var(--vw-card)",
          border: "1px solid var(--vw-border)",
        }}
        className="rounded-2xl p-8 shadow-2xl"
      >
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <div
              style={{ background: "var(--vw-accent)" }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            >
              G
            </div>
            <span
              style={{ color: "var(--vw-text)" }}
              className="font-semibold text-sm tracking-wide"
            >
              GyanKosh
            </span>
          </div>
          <h1
            style={{ color: "var(--vw-text)" }}
            className="text-2xl font-semibold"
          >
            Set new password
          </h1>
          <p style={{ color: "var(--vw-muted)" }} className="text-sm mt-1">
            Choose a strong password you haven't used recently.
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "var(--vw-error-bg)",
              border: "1px solid var(--vw-error-border)",
              color: "var(--vw-error-text)",
            }}
            className="mb-5 p-3 rounded-lg text-sm"
          >
            {error}
          </div>
        )}

        <div className="space-y-4">
          {[
            { label: "New password", value: password, onChange: setPassword },
            { label: "Confirm password", value: confirm, onChange: setConfirm },
          ].map((f) => (
            <div key={f.label}>
              <label
                style={{ color: "var(--vw-muted)" }}
                className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
              >
                {f.label}
              </label>
              <input
                type="password"
                value={f.value}
                onChange={(e) => f.onChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="••••••••••••"
                autoComplete="new-password"
                style={{
                  background: "var(--vw-input-bg)",
                  border: "1px solid var(--vw-border)",
                  color: "var(--vw-text)",
                }}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-gray-600"
              />
            </div>
          ))}
        </div>

        {password && (
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {requirements.map((r) => (
              <div
                key={r.text}
                className="text-xs flex items-center gap-1.5"
                style={{
                  color: r.met ? "var(--vw-success-text)" : "var(--vw-muted)",
                }}
              >
                <span>{r.met ? "✓" : "○"}</span>
                {r.text}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ background: "var(--vw-accent)" }}
          className="mt-6 w-full py-2.5 rounded-lg text-white font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {loading ? "Saving…" : "Save new password"}
        </button>

        <p className="mt-5 text-center text-sm">
          <Link
            href="/forgot-password"
            style={{ color: "var(--vw-accent)" }}
            className="hover:underline"
          >
            Request a new link
          </Link>
          {" · "}
          <Link
            href="/login"
            style={{ color: "var(--vw-accent)" }}
            className="hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
