"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authApi } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import {
  AuthCard,
  Alert,
  OTPInput,
  Button,
} from "../components/AuthComponents";

type Step = "loading" | "qr" | "confirm" | "backup";

export default function MFASetupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("loading");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.mfaEnabled) {
      router.replace("/profile");
      return;
    }
    initSetup();
  }, [user, router]);

  async function initSetup() {
    try {
      const res = await authApi.setupMfa();
      setQrCode(res.qrCode);
      setSecret(res.secret);
      setStep("qr");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Failed to initialise MFA setup.");
      setStep("qr");
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (token.length !== 6) return;
    setError("");
    setLoading(true);
    try {
      const res = await authApi.confirmMfa({ token });
      setBackupCodes(res.backupCodes || []);
      setStep("backup");
    } catch (err: unknown) {
      const e = err as { message?: string; error?: string };
      setError(e.error || e.message || "Invalid code. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyBackupCodes() {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (step === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <AuthCard
      title="Set up two-factor authentication"
      subtitle="Add an extra layer of security to your account"
    >
      {/* Step 1: Scan QR */}
      {step === "qr" && (
        <div className="space-y-5">
          {error && <Alert type="error" message={error} />}

          <ol className="space-y-2 text-sm text-gray-600">
            <li className="flex gap-2">
              <span className="font-bold text-blue-600">1.</span>
              Install an authenticator app (Google Authenticator, Authy, etc.)
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-blue-600">2.</span>
              Scan the QR code below
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-blue-600">3.</span>
              Enter the 6-digit code to confirm
            </li>
          </ol>

          {qrCode && (
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                {/* qrCode is a data URI from the backend */}
                <img src={qrCode} alt="MFA QR Code" className="h-44 w-44" />
              </div>
              <p className="text-xs text-gray-400">
                Can&apos;t scan?{" "}
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(secret);
                  }}
                  className="text-blue-600 hover:underline"
                >
                  Copy secret key
                </button>
              </p>
            </div>
          )}

          <Button onClick={() => setStep("confirm")}>
            Continue →
          </Button>
        </div>
      )}

      {/* Step 2: Confirm code */}
      {step === "confirm" && (
        <form onSubmit={handleConfirm} className="space-y-5">
          {error && <Alert type="error" message={error} />}

          <Alert
            type="info"
            message="Open your authenticator app and enter the 6-digit code shown for GyanKosh."
          />

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-gray-700">
              Authenticator code
            </p>
            <OTPInput value={token} onChange={setToken} length={6} />
          </div>

          <Button type="submit" loading={loading} disabled={token.length !== 6}>
            Enable MFA
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => setStep("qr")}
          >
            ← Back
          </Button>
        </form>
      )}

      {/* Step 3: Backup codes */}
      {step === "backup" && (
        <div className="space-y-5">
          <Alert
            type="success"
            message="MFA enabled! Save your backup codes somewhere safe."
          />

          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Backup codes — save these now
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {backupCodes.map((c, i) => (
                <code key={i} className="text-sm font-mono text-gray-800">
                  {c}
                </code>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Each code can only be used once. Store them somewhere secure (e.g.,
            a password manager).
          </p>

          <Button onClick={copyBackupCodes} variant="secondary">
            {copied ? "✓ Copied!" : "Copy backup codes"}
          </Button>

          <Button onClick={() => router.push("/profile")}>
            Done — go to profile
          </Button>
        </div>
      )}
    </AuthCard>
  );
}
