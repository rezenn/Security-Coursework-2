"use client";

import { useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/app/lib/api";

function VerifyEmailInner() {
  const router = useRouter();
  const email = useSearchParams().get("email") || "";
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...code];
    next[i] = val.slice(-1);
    setCode(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleSubmit = async () => {
    const fullCode = code.join("");
    if (fullCode.length < 6) {
      setError("Enter all 6 digits.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authApi.verifyEmailByCode({ email, code: fullCode });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (e: unknown) {
      const err = e as { error?: string; message?: string };
      setError(
        err.error || err.message || "Verification failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md px-4">
      <div
        style={{
          background: "var(--vw-card)",
          border: "1px solid var(--vw-border)",
        }}
        className="rounded-2xl p-8 shadow-2xl text-center"
      >
        <div
          style={{
            background: "#1e1e3a",
            border: "1px solid var(--vw-border)",
          }}
          className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-5"
        >
          <svg
            className="w-5 h-5"
            style={{ color: "var(--vw-accent)" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>

        <h1
          style={{ color: "var(--vw-text)" }}
          className="text-xl font-semibold mb-2"
        >
          Check your email
        </h1>
        <p style={{ color: "var(--vw-muted)" }} className="text-sm mb-6">
          6-digit code sent to{" "}
          <span style={{ color: "var(--vw-text)" }} className="font-medium">
            {email}
          </span>
        </p>

        {success && (
          <div
            style={{
              background: "var(--vw-success-bg)",
              border: "1px solid var(--vw-success-border)",
              color: "var(--vw-success-text)",
            }}
            className="mb-5 p-3 rounded-lg text-sm"
          >
            Email verified — redirecting to sign in…
          </div>
        )}
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

        <div className="flex justify-center gap-2 mb-6">
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !digit && i > 0)
                  inputs.current[i - 1]?.focus();
                if (e.key === "Enter" && i === 5) handleSubmit();
              }}
              style={{
                background: "var(--vw-input-bg)",
                border: digit
                  ? "1px solid var(--vw-accent)"
                  : "1px solid var(--vw-border)",
                color: "var(--vw-text)",
              }}
              className="w-11 h-12 text-center text-lg font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
            />
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || success}
          style={{ background: "var(--vw-accent)" }}
          className="w-full py-2.5 rounded-lg text-white font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {loading ? "Verifying…" : "Verify email"}
        </button>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailInner />
    </Suspense>
  );
}
