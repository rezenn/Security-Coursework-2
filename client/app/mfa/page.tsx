"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { useRecaptcha } from "../hooks/useRecaptcha";

export default function MFAPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { getToken } = useRecaptcha();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [useBackup, setUseBackup] = useState(false);
  const [backupCode, setBackupCode] = useState("");

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("mfaEmail");
    if (!storedEmail) {
      router.replace("/login");
      return;
    }
    setEmail(storedEmail);
  }, [router]);

  async function handleVerify() {
    setError("");
    setLoading(true);
    const mfaToken = useBackup ? backupCode : code;
    try {
      const captchaToken = await getToken("mfa_verify");
      const password = sessionStorage.getItem("mfaPassword") || "";
      const res = await authApi.login({
        email,
        password,
        captchaToken,
        mfaToken,
      });

      if ("accessToken" in res) {
        sessionStorage.removeItem("mfaEmail");
        sessionStorage.removeItem("mfaPassword");
        login(res.accessToken, res.user);
        router.push("/dashboard");
      }
    } catch (e: unknown) {
      const err = e as { error?: string; message?: string };
      setError(err.error || err.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md px-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold">
              G
            </div>
            <span className="font-semibold text-gray-900 text-sm">
              GyanKosh
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Two-factor authentication
          </h1>
          {email && (
            <p className="text-sm text-gray-500 mb-6">
              Signing in as <strong className="text-gray-700">{email}</strong>
            </p>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {!useBackup ? (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Authentication code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                placeholder="000000"
                autoComplete="one-time-code"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-center text-2xl font-semibold tracking-[0.5em] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 mb-5"
              />
              <button
                onClick={handleVerify}
                disabled={loading || code.length !== 6}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Verifying…" : "Verify"}
              </button>
              <button
                onClick={() => setUseBackup(true)}
                className="mt-3 w-full text-sm text-gray-500 hover:text-gray-700 hover:underline"
              >
                Use a backup code instead
              </button>
            </>
          ) : (
            <>
              <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                Backup codes are single-use. Each code can only be used once.
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Backup code
              </label>
              <input
                type="text"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.trim())}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                placeholder="xxxxxxxxxxxxxxxx"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 mb-5"
              />
              <button
                onClick={handleVerify}
                disabled={loading || !backupCode}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Verifying…" : "Verify with backup code"}
              </button>
              <button
                onClick={() => setUseBackup(false)}
                className="mt-3 w-full text-sm text-gray-500 hover:text-gray-700 hover:underline"
              >
                ← Use authenticator app instead
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
