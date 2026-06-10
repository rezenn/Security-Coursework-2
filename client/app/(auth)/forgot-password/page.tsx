"use client";
import { useState } from "react";
// import { authApi } from "@/lib/api";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // const handleSubmit = async () => {
  //   setError("");
  //   setLoading(true);
  //   try {
  //     const res = await authApi.requestPasswordReset({
  //       email,
  //       captchaToken: "test-token",
  //     });
  //     if (!res.ok) {
  //       const d = await res.json();
  //       throw new Error(d.error);
  //     }
  //     setSent(true);
  //   } catch (e: any) {
  //     setError(e.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <div className="w-full max-w-md px-4">
      <div
        style={{
          background: "var(--vw-card)",
          border: "1px solid var(--vw-border)",
        }}
        className="rounded-2xl p-8 shadow-2xl"
      >
        {sent ? (
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
              Check your inbox
            </h2>
            <p style={{ color: "var(--vw-muted)" }} className="text-sm mb-5">
              If <span style={{ color: "var(--vw-text)" }}>{email}</span> has an
              account, a reset link is on the way.
            </p>
            <Link
              href="/login"
              style={{ color: "var(--vw-accent)" }}
              className="text-sm hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-6">
                <div
                  style={{ background: "var(--vw-accent)" }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                >
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <span
                  style={{ color: "var(--vw-text)" }}
                  className="font-semibold text-sm tracking-wide"
                >
                  VaultWork
                </span>
              </div>
              <h1
                style={{ color: "var(--vw-text)" }}
                className="text-2xl font-semibold"
              >
                Reset password
              </h1>
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
              // onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="you@example.com"
              style={{
                background: "var(--vw-input-bg)",
                border: "1px solid var(--vw-border)",
                color: "var(--vw-text)",
              }}
              className="w-full px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-gray-600"
            />

            <button
              // onClick={handleSubmit}
              disabled={loading}
              style={{ background: "var(--vw-accent)" }}
              className="mt-5 w-full py-2.5 rounded-lg text-white font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {loading ? "Sending..." : "Send reset link"}
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
      </div>
    </div>
  );
}
