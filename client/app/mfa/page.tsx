"use client";

import { useState } from "react";
import AppShell from "../components/AppShell";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function MFASetupPage() {
  const [email, setEmail] = useState("");
  const [setupData, setSetupData] = useState<{
    qrCode?: string;
    secret?: string;
  } | null>(null);
  const [token, setToken] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestSetup = async () => {
    setError(null);
    setMessage(null);

    const response = await fetch(`${API_URL}/api/auth/mfa/setup`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to start MFA setup.");
      return;
    }

    setSetupData(data);
  };

  const confirmSetup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const response = await fetch(`${API_URL}/api/auth/mfa/confirm`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to confirm MFA setup.");
      return;
    }

    setMessage("MFA setup confirmed. Your account is now protected.");
  };

  return (
    <AppShell>
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <h2 className="mb-4 text-3xl font-semibold">
          Multi-Factor Authentication
        </h2>
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">
            <p className="mb-2 text-sm font-medium">Step 1: Request setup</p>
            <label className="block">
              <span className="mb-2 block text-sm">Email</span>
              <input
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="Your email"
              />
            </label>
            <button
              className="mt-3 rounded-2xl bg-slate-950 px-5 py-3 text-white transition hover:bg-slate-800"
              type="button"
              onClick={requestSetup}
            >
              Start MFA setup
            </button>
          </div>

          {setupData ? (
            <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">
              <p className="mb-3 font-medium">
                Step 2: Scan QR code or copy secret
              </p>
              {setupData.qrCode ? (
                <img
                  src={setupData.qrCode}
                  alt="MFA QR Code"
                  className="mx-auto h-48 w-48 rounded-2xl bg-white p-4"
                />
              ) : null}
              {setupData.secret ? (
                <p className="break-all text-sm">Secret: {setupData.secret}</p>
              ) : null}
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={confirmSetup}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Enter code from authenticator
              </span>
              <input
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-900"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                type="text"
                placeholder="123456"
                required
              />
            </label>
            <button
              className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-white transition hover:bg-slate-800"
              type="submit"
            >
              Confirm MFA
            </button>
          </form>

          {message ? (
            <p className="text-sm text-emerald-700">{message}</p>
          ) : null}
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        </div>
      </div>
    </AppShell>
  );
}
