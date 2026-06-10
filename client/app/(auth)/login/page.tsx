"use client";
import { useState } from "react";
// import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  // const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // const handleSubmit = async () => {
  //   setError("");
  //   setLoading(true);
  //   try {
  //     const result = await login(
  //       email,
  //       password,
  //       "test-token",
  //       mfaRequired ? mfaToken : undefined,
  //     );
  //     if (result.mfaRequired) {
  //       setMfaRequired(true);
  //       setLoading(false);
  //       return;
  //     }
  //     router.push("/dashboard");
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
            {mfaRequired ? "Two-factor auth" : "Sign in"}
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

        {!mfaRequired ? (
          <div className="space-y-4">
            {[
              {
                label: "Email",
                type: "email",
                value: email,
                onChange: setEmail,
                placeholder: "you@example.com",
              },
              {
                label: "Password",
                type: "password",
                value: password,
                onChange: setPassword,
                placeholder: "••••••••••••",
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
                  type={f.type}
                  value={f.value}
                  onChange={(e) => f.onChange(e.target.value)}
                  // onKeyDown={(e) =>
                  //   f.type === "password" && e.key === "Enter" && handleSubmit()
                  // }
                  placeholder={f.placeholder}
                  style={{
                    background: "var(--vw-input-bg)",
                    border: "1px solid var(--vw-border)",
                    color: "var(--vw-text)",
                  }}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-gray-600"
                />
              </div>
            ))}
            <div className="text-right">
              <Link
                href="/forgot-password"
                style={{ color: "var(--vw-accent)" }}
                className="text-xs hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ color: "var(--vw-muted)" }} className="text-sm mb-4">
              Enter the 6-digit code from your authenticator app.
            </p>
            <input
              type="text"
              maxLength={6}
              value={mfaToken}
              onChange={(e) => setMfaToken(e.target.value)}
              placeholder="000000"
              style={{
                background: "var(--vw-input-bg)",
                border: "1px solid var(--vw-border)",
                color: "var(--vw-text)",
              }}
              className="w-full px-3.5 py-2.5 rounded-lg text-center text-xl font-semibold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:tracking-normal"
            />
          </div>
        )}

        <button
          // onClick={handleSubmit}
          disabled={loading}
          style={{
            background: loading ? "var(--vw-border)" : "var(--vw-accent)",
          }}
          className="mt-6 w-full py-2.5 rounded-lg text-white font-medium text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in..." : mfaRequired ? "Verify code" : "Sign in"}
        </button>

        <p
          style={{ color: "var(--vw-muted)" }}
          className="mt-5 text-center text-sm"
        >
          No account?{" "}
          <Link
            href="/register"
            style={{ color: "var(--vw-accent)" }}
            className="hover:underline font-medium"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
