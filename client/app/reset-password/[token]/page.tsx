"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ResetPasswordPage({
  params,
}: {
  params: { token?: string };
}) {
  const token = params.token;
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("ready");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setError("Reset token is missing.");
    }
  }, [token]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setError("Reset token is required.");
      return;
    }
    setError(null);
    setMessage(null);

    const response = await fetch(
      `${API_URL}/api/auth/reset-password/${token}`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Unable to reset password.");
      return;
    }

    setMessage("Password updated successfully. You can now log in.");
    setPassword("");
  };

  return (
    <AppShell>
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <h2 className="mb-4 text-3xl font-semibold">Reset Password</h2>
        {status === "invalid" ? (
          <p className="text-sm text-rose-700">Token missing from the URL.</p>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                New password
              </span>
              <input
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-900"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
              />
            </label>
            <button
              className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-white transition hover:bg-slate-800"
              type="submit"
            >
              Reset password
            </button>
            {message ? (
              <p className="mt-2 text-sm text-emerald-700">{message}</p>
            ) : null}
            {error ? (
              <p className="mt-2 text-sm text-rose-700">{error}</p>
            ) : null}
          </form>
        )}
      </div>
    </AppShell>
  );
}
