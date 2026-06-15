"use client";
// Login page — GyanKosh
// Security: rate limiting on server, reCAPTCHA v3 (visible badge via layout.tsx),
// MFA flow via sessionStorage temp handoff (NIST SP 800-63B §5.2.3)
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/app/lib/api";
import { useAuth } from "@/app/hooks/useAuth";
import { useRecaptcha } from "@/app/hooks/useRecaptcha";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const { getToken, siteKey } = useRecaptcha();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaChecking, setCaptchaChecking] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      // Show brief captcha-checking state so user sees verification happening
      setCaptchaChecking(true);
      const captchaToken = await getToken("login");
      setCaptchaChecking(false);

      let result;
      try {
        result = await authApi.login({
          email,
          password,
          captchaToken,
          mfaToken: mfaRequired && mfaToken ? mfaToken : undefined,
        });
      } catch (e: unknown) {
        // The server returns 401 with { error: "MFA_REQUIRED", mfaRequired: true }
        // Our fetch wrapper throws on non-2xx, so we catch it here and check the body.
        const err = e as {
          error?: string;
          mfaRequired?: boolean;
          tempToken?: string;
          message?: string;
          status?: number;
        };
        if (err.mfaRequired === true || err.error === "MFA_REQUIRED") {
          // Stash credentials for the MFA step re-auth
          sessionStorage.setItem("mfaEmail", email);
          sessionStorage.setItem("mfaPassword", password);
          setMfaRequired(true);
          setLoading(false);
          return;
        }
        // Any other error — surface it
        setError(
          err.error || err.message || "Sign in failed. Please try again.",
        );
        setLoading(false);
        return;
      }

      if ("accessToken" in result) {
        sessionStorage.removeItem("mfaEmail");
        sessionStorage.removeItem("mfaPassword");
        login(result.accessToken, result.user);
        router.push("/dashboard");
      }
    } catch (e: unknown) {
      setCaptchaChecking(false);
      const err = e as { error?: string; message?: string };
      setError(err.error || err.message || "Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const buttonLabel = () => {
    if (captchaChecking) return "Verifying CAPTCHA…";
    if (loading) return "Signing in…";
    if (mfaRequired) return "Verify code";
    return "Sign in";
  };

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
            {mfaRequired ? "Two-factor auth" : "Sign in"}
          </h1>
          <p style={{ color: "var(--vw-muted)" }} className="text-sm mt-1">
            {mfaRequired
              ? "Enter the 6-digit code from your authenticator app."
              : "Access your academic resources securely."}
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
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder={f.placeholder}
                  autoComplete={
                    f.type === "email" ? "email" : "current-password"
                  }
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
              Signing in as{" "}
              <strong style={{ color: "var(--vw-text)" }}>{email}</strong>
            </p>
            <label
              style={{ color: "var(--vw-muted)" }}
              className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
            >
              Authenticator Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={mfaToken}
              onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) =>
                e.key === "Enter" && mfaToken.length === 6 && handleSubmit()
              }
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
              onClick={() => {
                setMfaRequired(false);
                setMfaToken("");
                sessionStorage.removeItem("mfaEmail");
                sessionStorage.removeItem("mfaPassword");
              }}
              style={{ color: "var(--vw-muted)" }}
              className="mt-3 text-xs hover:underline"
            >
              ← Back to sign in
            </button>
          </div>
        )}

        {/* CAPTCHA checking indicator */}
        {captchaChecking && (
          <div
            style={{ color: "var(--vw-muted)" }}
            className="mt-3 flex items-center gap-2 text-xs"
          >
            <svg
              className="h-3 w-3 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            Verifying reCAPTCHA…
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={
            loading || captchaChecking || (mfaRequired && mfaToken.length !== 6)
          }
          style={{
            background:
              loading || captchaChecking
                ? "var(--vw-border)"
                : "var(--vw-accent)",
          }}
          className="mt-6 w-full py-2.5 rounded-lg text-white font-medium text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {buttonLabel()}
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
