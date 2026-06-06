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

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    const verifyEmail = async () => {
      const response = await fetch(`${API_URL}/api/auth/verify-email/${token}`);
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
  }, [token]);

  return (
    <AppShell>
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <h2 className="mb-4 text-3xl font-semibold">Verify Email</h2>
        <p className="text-slate-700">{message}</p>
        {status === "success" ? (
          <p className="mt-4 text-sm text-emerald-700">
            Verification completed successfully.
          </p>
        ) : null}
      </div>
    </AppShell>
  );
}
