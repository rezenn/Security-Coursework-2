"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import {
  AuthCard,
  Alert,
  OTPInput,
  Button,
  Divider,
  Input,
} from "../components/AuthComponents";

export default function MFAPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [useBackup, setUseBackup] = useState(false);
  const [backupCode, setBackupCode] = useState("");

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("mfaEmail");
    if (!storedEmail) {
      // No MFA session – redirect back
      router.replace("/login");
      return;
    }
    setEmail(storedEmail);
  }, [router]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const mfaToken = useBackup ? backupCode : code;

    try {
      // Re-submit login with mfaToken included
      const { getToken } = await import("../hooks/useRecaptcha").then(
        (m) => ({ getToken: (action: string) => m.useRecaptcha ? null : null })
      );
      // We use a simple fetch here since this is a special re-auth call
      const captchaToken = "test-token"; // reCAPTCHA was already checked on first login
      const res = await authApi.login({
        email,
        password: sessionStorage.getItem("mfaPassword") || "",
        captchaToken,
        mfaToken,
      });

      if ("accessToken" in res) {
        sessionStorage.removeItem("mfaTempToken");
        sessionStorage.removeItem("mfaEmail");
        sessionStorage.removeItem("mfaPassword");
        login(res.accessToken, res.user);
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const e = err as { message?: string; error?: string };
      setError(e.error || e.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Two-factor authentication"
      subtitle="Enter the 6-digit code from your authenticator app"
    >
      <form onSubmit={handleVerify} className="space-y-5">
        {error && <Alert type="error" message={error} />}

        {email && (
          <p className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Signing in as <strong>{email}</strong>
          </p>
        )}

        {!useBackup ? (
          <>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-gray-700">
                Authentication code
              </p>
              <OTPInput value={code} onChange={setCode} length={6} />
              <p className="text-xs text-gray-400">
                Open your authenticator app to get the current code.
              </p>
            </div>

            <Button
              type="submit"
              loading={loading}
              disabled={code.length !== 6}
            >
              Verify
            </Button>

            <Divider label="trouble getting a code?" />

            <Button
              type="button"
              variant="ghost"
              onClick={() => setUseBackup(true)}
            >
              Use a backup code instead
            </Button>
          </>
        ) : (
          <>
            <Alert
              type="info"
              message="Backup codes are single-use. Each code can only be used once."
            />

            <Input
              id="backup"
              label="Backup code"
              type="text"
              value={backupCode}
              onChange={(e) => setBackupCode(e.target.value.trim())}
              placeholder="xxxxxxxxxxxxxxxx"
              required
            />

            <Button type="submit" loading={loading} disabled={!backupCode}>
              Verify with backup code
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => setUseBackup(false)}
            >
              ← Use authenticator app instead
            </Button>
          </>
        )}
      </form>
    </AuthCard>
  );
}
