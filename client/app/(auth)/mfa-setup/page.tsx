"use client";
import { useEffect, useState } from "react";
import { ShieldCheck, Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Spinner, ErrorAlert, SuccessAlert } from "@/components/shared";
import Image from "next/image";

export default function MFASetupPage() {
  const { loading: authLoading } = useRequireAuth();
  const [setup, setSetup] = useState<{ qrCodeDataUrl: string; backupCodes: string[] } | null>(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    authApi.setupMFA()
      .then((d) => setSetup(d))
      .catch((e) => setError(e?.response?.data?.error || "Failed to initialize MFA setup"))
      .finally(() => setLoading(false));
  }, [authLoading]);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirming(true);
    setError("");
    try {
      await authApi.confirmMFA(token);
      setSuccess("MFA enabled! Your account is now protected with two-factor authentication.");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Invalid code. Try again.");
    } finally {
      setConfirming(false);
    }
  };

  const copyBackupCodes = () => {
    if (!setup) return;
    navigator.clipboard.writeText(setup.backupCodes.join("\n"));
    setCopied(true);
    toast.success("Backup codes copied!");
    setTimeout(() => setCopied(false), 3000);
  };

  if (loading) return <div className="flex justify-center p-12"><Spinner size={28} className="text-blue-400" /></div>;

  return (
    <div className="card max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
          <ShieldCheck className="text-blue-400" size={18} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Enable 2FA</h1>
          <p className="text-slate-400 text-sm">Protect your account with an authenticator app</p>
        </div>
      </div>

      {error && <div className="mb-4"><ErrorAlert message={error} /></div>}
      {success && <div className="mb-4"><SuccessAlert message={success} /></div>}

      {setup && !success && (
        <>
          <div className="space-y-4">
            <div>
              <p className="text-slate-300 text-sm mb-3 font-medium">Step 1 — Scan this QR code</p>
              <div className="bg-white rounded-xl p-3 w-fit mx-auto">
                <img src={setup.qrCodeDataUrl} alt="MFA QR Code" width={200} height={200} />
              </div>
              <p className="text-xs text-slate-500 text-center mt-2">
                Use Google Authenticator, Authy, or any TOTP app
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-300 text-sm font-medium">Step 2 — Save backup codes</p>
                <button onClick={copyBackupCodes} className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300">
                  {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
                  {copied ? "Copied!" : "Copy all"}
                </button>
              </div>
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 grid grid-cols-2 gap-1">
                {setup.backupCodes.map((code, i) => (
                  <code key={i} className="text-xs text-green-400 font-mono">{code}</code>
                ))}
              </div>
              <p className="text-xs text-yellow-400 mt-2">⚠️ Store these somewhere safe — they can only be shown once.</p>
            </div>

            <form onSubmit={handleConfirm}>
              <p className="text-slate-300 text-sm font-medium mb-2">Step 3 — Verify setup</p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter 6-digit code from app"
                className="input tracking-[0.3em] text-center text-lg mb-3"
              />
              <button type="submit" disabled={confirming || token.length !== 6} className="btn-primary w-full flex items-center justify-center gap-2">
                {confirming ? <Spinner size={16} /> : <ShieldCheck size={16} />}
                Enable 2FA
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
