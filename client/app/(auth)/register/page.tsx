"use client";
// Register page — GyanKosh
// NIST SP 800-63B §5.1.1: password policy enforced client + server side.
// reCAPTCHA v3 protects against automated registration (OWASP WSTG-AUTHN-09)
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/app/lib/api";
import { useRecaptcha } from "@/app/hooks/useRecaptcha";

export default function RegisterPage() {
  const router = useRouter();
  const { getToken } = useRecaptcha();
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    // Username — only letters, numbers, hyphens, underscores (no spaces)
    if (!/^[a-zA-Z0-9_-]+$/.test(form.username.trim())) {
      setError(
        "Username can only contain letters, numbers, hyphens (-), and underscores (_). No spaces allowed.",
      );
      return;
    }
    // Client-side pre-validation (NIST 800-63B — reduce unnecessary server calls)
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 12) {
      setError("Password must be at least 12 characters.");
      return;
    }
    if (
      !/[A-Z]/.test(form.password) ||
      !/[0-9]/.test(form.password) ||
      !/[^a-zA-Z0-9]/.test(form.password)
    ) {
      setError(
        "Password must include an uppercase letter, a number, and a special character.",
      );
      return;
    }
    setLoading(true);
    try {
      // OWASP WSTG-AUTHN-09: CAPTCHA before account creation
      const captchaToken = await getToken("register");
      await authApi.register({
        email: form.email,
        username: form.username,
        password: form.password,
        captchaToken,
      });
      // Redirect to email verification with pre-filled email
      router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (e: unknown) {
      const err = e as { error?: string; message?: string };
      setError(
        err.error || err.message || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const requirements = [
    { text: "12+ characters", met: form.password.length >= 12 },
    { text: "Uppercase letter", met: /[A-Z]/.test(form.password) },
    { text: "Number", met: /[0-9]/.test(form.password) },
    { text: "Special character", met: /[^a-zA-Z0-9]/.test(form.password) },
    {
      text: "Passwords match",
      met: form.confirm.length > 0 && form.password === form.confirm,
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
            Create account
          </h1>
          <p style={{ color: "var(--vw-muted)" }} className="text-sm mt-1">
            Join the academic resource marketplace.
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
            {
              label: "Email",
              key: "email",
              type: "email",
              placeholder: "you@example.com",
              autoComplete: "email",
            },
            {
              label: "Username",
              key: "username",
              type: "text",
              placeholder: "johndoe",
              autoComplete: "username",
              hint: "Letters, numbers, - and _ only. No spaces.",
            },
            {
              label: "Password",
              key: "password",
              type: "password",
              placeholder: "••••••••••••",
              autoComplete: "new-password",
            },
            {
              label: "Confirm password",
              key: "confirm",
              type: "password",
              placeholder: "••••••••••••",
              autoComplete: "new-password",
            },
          ].map((f) => (
            <div key={f.key}>
              <label
                style={{ color: "var(--vw-muted)" }}
                className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
              >
                {f.label}
              </label>
              <input
                type={f.type}
                value={(form as Record<string, string>)[f.key]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [f.key]: e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder={f.placeholder}
                autoComplete={f.autoComplete}
                style={{
                  background: "var(--vw-input-bg)",
                  border: "1px solid var(--vw-border)",
                  color: "var(--vw-text)",
                }}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-gray-600"
              />
              {(f as any).hint && (
                <p
                  className="mt-1 text-xs"
                  style={{ color: "var(--vw-muted)" }}
                >
                  {(f as any).hint}
                </p>
              )}
            </div>
          ))}
        </div>

        {form.password && (
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
          className="mt-6 w-full py-2.5 rounded-lg text-white font-medium text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>

        <p
          style={{ color: "var(--vw-muted)" }}
          className="mt-5 text-center text-sm"
        >
          Already have an account?{" "}
          <Link
            href="/login"
            style={{ color: "var(--vw-accent)" }}
            className="hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
