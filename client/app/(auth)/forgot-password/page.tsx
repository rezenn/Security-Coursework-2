"use client";
// Forgot password — GyanKosh
// OWASP WSTG-AUTHN-09: vague response prevents user enumeration.
// Supports both link-based and code-based reset without leaving this page.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/app/lib/api";
import { useRecaptcha } from "@/app/hooks/useRecaptcha";

type Step = "email" | "code" | "newPassword" | "done";

export default function ForgotPasswordPage() {
  const { getToken } = useRecaptcha();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>("email");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1: Request reset email
  const handleRequestReset = async () => {
    setError("");
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      const captchaToken = await getToken("password_reset");
      await authApi.requestPasswordReset({ email, captchaToken });
      setStep("code");
    } catch (e: unknown) {
      const err = e as { error?: string; message?: string };
      setError(
        err.error || err.message || "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Validate the 6-digit code (just move to password step; actual validation
  //         happens server-side when we submit the new password)
  const handleCodeContinue = () => {
    setError("");
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setStep("newPassword");
  };

  // Step 3: Submit new password with code
  const handleResetWithCode = async () => {
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 12) {
      setError("Password must be at least 12 characters.");
      return;
    }
    setLoading(true);
    try {
      const captchaToken = await getToken("reset_password_code");
      // Use the code-based reset endpoint: POST /reset-password with { email, code, password }
      await authApi.resetPasswordWithCode({
        email,
        code,
        password,
        captchaToken,
      });
      setStep("done");
    } catch (e: unknown) {
      const err = e as { error?: string; message?: string };
      // Surface specific "reused password" error clearly
      const msg = err.error || err.message || "";
      if (
        msg.toLowerCase().includes("reuse") ||
        msg.toLowerCase().includes("history")
      ) {
        setError(
          "You cannot reuse a recent password for this account. Please choose a different password.",
        );
      } else {
        setError(
          msg || "Reset failed. The code may have expired — request a new one.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const passwordRequirements = [
    { text: "12+ characters", met: password.length >= 12 },
    { text: "Uppercase letter", met: /[A-Z]/.test(password) },
    { text: "Number", met: /[0-9]/.test(password) },
    { text: "Special character", met: /[^a-zA-Z0-9]/.test(password) },
    {
      text: "Passwords match",
      met: confirmPassword.length > 0 && password === confirmPassword,
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
        {/* Brand */}
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

        {/* ── DONE ── */}
        {step === "done" && (
          <div className="text-center">
            <div
              style={{
                background: "var(--vw-success-bg)",
                border: "1px solid var(--vw-success-border)",
              }}
              className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-5"
            >
              <svg
                className="w-5 h-5"
                style={{ color: "var(--vw-success-text)" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2
              style={{ color: "var(--vw-text)" }}
              className="text-xl font-semibold mb-2"
            >
              Password updated!
            </h2>
            <p style={{ color: "var(--vw-muted)" }} className="text-sm mb-5">
              Your password has been reset successfully.
            </p>
            <button
              onClick={() => router.push("/login")}
              style={{ background: "var(--vw-accent)" }}
              className="w-full py-2.5 rounded-lg text-white font-medium text-sm hover:opacity-90 transition-all"
            >
              Back to sign in
            </button>
          </div>
        )}

        {/* ── STEP 1: Email ── */}
        {step === "email" && (
          <>
            <h1
              style={{ color: "var(--vw-text)" }}
              className="text-2xl font-semibold mb-1"
            >
              Reset password
            </h1>
            <p style={{ color: "var(--vw-muted)" }} className="text-sm mb-6">
              Enter your email and we will send a reset code.
            </p>
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
            <label
              style={{ color: "var(--vw-muted)" }}
              className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRequestReset()}
              placeholder="you@example.com"
              autoComplete="email"
              style={{
                background: "var(--vw-input-bg)",
                border: "1px solid var(--vw-border)",
                color: "var(--vw-text)",
              }}
              className="w-full px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-gray-600"
            />
            <button
              onClick={handleRequestReset}
              disabled={loading}
              style={{ background: "var(--vw-accent)" }}
              className="mt-5 w-full py-2.5 rounded-lg text-white font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {loading ? "Sending…" : "Send reset code"}
            </button>
            <p className="mt-5 text-center text-sm">
              <Link
                href="/login"
                style={{ color: "var(--vw-accent)" }}
                className="hover:underline"
              >
                Back to sign in
              </Link>
            </p>
          </>
        )}

        {/* ── STEP 2: Enter Code ── */}
        {step === "code" && (
          <>
            <h1
              style={{ color: "var(--vw-text)" }}
              className="text-2xl font-semibold mb-1"
            >
              Check your email
            </h1>
            <p style={{ color: "var(--vw-muted)" }} className="text-sm mb-1">
              We sent a 6-digit code and a reset link to{" "}
              <strong style={{ color: "var(--vw-text)" }}>{email}</strong>.
            </p>
            <p style={{ color: "var(--vw-muted)" }} className="text-xs mb-6">
              You can either click the link in the email, or enter the code
              below.
            </p>
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
            <label
              style={{ color: "var(--vw-muted)" }}
              className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
            >
              6-digit reset code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              onKeyDown={(e) => e.key === "Enter" && handleCodeContinue()}
              placeholder="000000"
              autoComplete="one-time-code"
              autoFocus
              style={{
                background: "var(--vw-input-bg)",
                border: "1px solid var(--vw-border)",
                color: "var(--vw-text)",
              }}
              className="w-full px-3.5 py-2.5 rounded-lg text-center text-xl font-semibold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
            />
            <button
              onClick={handleCodeContinue}
              disabled={code.length !== 6}
              style={{ background: "var(--vw-accent)" }}
              className="mt-5 w-full py-2.5 rounded-lg text-white font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-all"
            >
              Continue
            </button>
            <button
              onClick={() => {
                setStep("email");
                setError("");
                setCode("");
              }}
              style={{ color: "var(--vw-muted)" }}
              className="mt-3 w-full text-sm hover:underline"
            >
              ← Try a different email
            </button>
          </>
        )}

        {/* ── STEP 3: New Password ── */}
        {step === "newPassword" && (
          <>
            <h1
              style={{ color: "var(--vw-text)" }}
              className="text-2xl font-semibold mb-1"
            >
              Set new password
            </h1>
            <p style={{ color: "var(--vw-muted)" }} className="text-sm mb-6">
              Choose a strong password for{" "}
              <strong style={{ color: "var(--vw-text)" }}>{email}</strong>.
            </p>
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
                {
                  label: "New password",
                  value: password,
                  onChange: setPassword,
                },
                {
                  label: "Confirm password",
                  value: confirmPassword,
                  onChange: setConfirmPassword,
                },
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
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleResetWithCode()
                    }
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
                {passwordRequirements.map((r) => (
                  <div
                    key={r.text}
                    className="text-xs flex items-center gap-1.5"
                    style={{
                      color: r.met
                        ? "var(--vw-success-text)"
                        : "var(--vw-muted)",
                    }}
                  >
                    <span>{r.met ? "✓" : "○"}</span>
                    {r.text}
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={handleResetWithCode}
              disabled={loading}
              style={{ background: "var(--vw-accent)" }}
              className="mt-6 w-full py-2.5 rounded-lg text-white font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {loading ? "Saving…" : "Save new password"}
            </button>
            <button
              onClick={() => {
                setStep("code");
                setError("");
                setPassword("");
                setConfirmPassword("");
              }}
              style={{ color: "var(--vw-muted)" }}
              className="mt-3 w-full text-sm hover:underline"
            >
              ← Re-enter code
            </button>
          </>
        )}
      </div>
    </div>
  );
}
