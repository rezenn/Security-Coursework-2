"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AppShell from "../components/AppShell";
import {
  AuthCard,
  AuthInput,
  AuthButton,
  AuthAlert,
} from "../components/AuthComponents";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"waiting" | "success" | "error">(
    "waiting",
  );
  const [message, setMessage] = useState<string>("Verifying your email...");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (token) {
      const verifyEmail = async () => {
        try {
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
          setMessage("Your email has been verified successfully!");
          setTimeout(() => {
            router.push("/login");
          }, 2000);
        } catch (err) {
          setStatus("error");
          setMessage("An error occurred. Please try again.");
        }
      };

      verifyEmail();
    }
  }, [token, router]);

  const handleCodeVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code) {
      setMessage("Please enter both email and code.");
      return;
    }
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setMessage(data.error || "Verification failed.");
        setIsLoading(false);
        return;
      }

      setStatus("success");
      setMessage("Your email has been verified successfully!");
      setEmail("");
      setCode("");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setStatus("error");
      setMessage("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {status === "waiting" && token ? (
            <AuthCard title="Verifying Email" subtitle="Please wait...">
              <AuthAlert type="info" message={message} />
              <div className="animate-spin h-8 w-8 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mt-4"></div>
            </AuthCard>
          ) : status === "success" ? (
            <AuthCard title="Email Verified" subtitle="You're all set!">
              <AuthAlert type="success" message={message} />
              <div className="mt-6 text-center">
                <p className="text-sm text-slate-600">
                  Redirecting to login...
                </p>
              </div>
            </AuthCard>
          ) : (
            <AuthCard
              title="Verify Email"
              subtitle="Enter your verification code"
            >
              {status === "error" && message && (
                <AuthAlert type="error" message={message} />
              )}

              <form onSubmit={handleCodeVerify} className="space-y-5">
                <p className="text-sm text-slate-600">
                  Enter the 6-digit code we sent to your email.
                </p>

                <AuthInput
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <AuthInput
                  label="Verification Code"
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  maxLength={6}
                  required
                />

                <AuthButton type="submit" loading={isLoading} variant="primary">
                  Verify Email
                </AuthButton>
              </form>

              <div className="mt-6 border-t border-slate-200 pt-6">
                <p className="text-center text-sm text-slate-600">
                  Already verified?{" "}
                  <a
                    href="/login"
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    Go to login
                  </a>
                </p>
              </div>
            </AuthCard>
          )}
        </div>
      </div>
    </AppShell>
  );
}
