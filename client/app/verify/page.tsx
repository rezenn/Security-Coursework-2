"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "../components/AppShell";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("waiting");
  const [message, setMessage] = useState<string>("Verifying your link...");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (token) {
      const verifyEmail = async () => {
        const response = await fetch(
          `${API_URL}/api/auth/verify-email/${token}`,
        );
        const data = await response.json();

        if (!response.ok) {
          setStatus("error");
          setMessage(data.error || "Verification failed.");
          return;
        }

        setStatus("success");
        setMessage("Your email is verified. You can now log in.");
      };

      verifyEmail();
    }
  }, [token]);

  const handleCodeVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code) {
      setMessage("Please enter both email and code.");
      return;
    }
    setIsLoading(true);

    const response = await fetch(`${API_URL}/api/auth/verify-email`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });

    const data = await response.json();
    setIsLoading(false);

    if (!response.ok) {
      setStatus("error");
      setMessage(data.error || "Verification failed.");
      return;
    }

    setStatus("success");
    setMessage("Your email is verified. You can now log in.");
    setEmail("");
    setCode("");
  };

  return (
    <AppShell>
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <h2 className="mb-4 text-3xl font-semibold">Verify Email</h2>

        {status === "waiting" && token ? (
          <p className="text-slate-700">{message}</p>
        ) : status === "success" ? (
          <div>
            <p className="text-slate-700">{message}</p>
            <p className="mt-4 text-sm text-emerald-700">
              Verification completed successfully.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-slate-700 text-sm mb-4">
              If you didn't verify via link, enter your email and verification
              code:
            </p>
            <form className="space-y-3" onSubmit={handleCodeVerify}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Email
                </span>
                <input
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-900"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="your@email.com"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  6-digit Code
                </span>
                <input
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-slate-900"
                  value={code}
                  onChange={(e) => setCode(e.target.value.slice(0, 6))}
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  required
                />
              </label>
              <button
                className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Verifying..." : "Verify Email"}
              </button>
            </form>
          </div>
        )}

        {message && status === "error" && (
          <p className="mt-2 text-sm text-rose-700">{message}</p>
        )}
      </div>
    </AppShell>
  );
}
