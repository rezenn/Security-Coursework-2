"use client";

import { useState } from "react";
import AppShell from "../components/AppShell";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, mfaToken }),
    });

    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Login failed");
      return;
    }

    localStorage.setItem("gyanKoshAccessToken", data.accessToken);
    setMessage("Login successful. You can now visit your profile.");
  };

  return (
    <AppShell>
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <h2 className="mb-4 text-3xl font-semibold">Login</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </span>
            <input
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </span>
            <input
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-900"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              MFA Token (optional)
            </span>
            <input
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-900"
              value={mfaToken}
              onChange={(e) => setMfaToken(e.target.value)}
              type="text"
              placeholder="123456"
            />
          </label>
          <button
            className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-white transition hover:bg-slate-800"
            type="submit"
          >
            Sign In
          </button>
          {message ? (
            <p className="mt-2 text-sm text-emerald-700">{message}</p>
          ) : null}
          {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
        </form>
      </div>
    </AppShell>
  );
}
