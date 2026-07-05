"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MailCheck, CheckCircle, XCircle } from "lucide-react";
import { authApi } from "@/lib/api";
import { Spinner, ErrorAlert } from "@/components/shared";
import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="card text-center">
          <p className="text-slate-400">Loading verification status...</p>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email") || "";

  // Token present (user clicked the link in their email) -> auto-verify.
  // No token (user was redirected here right after registering) -> show
  // a form so they can enter the 6-digit code from the same email instead.
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "success",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;
    authApi
      .verifyEmailToken(token)
      .then(() => {
        setStatus("success");
        setMessage("Email verified! You can now log in.");
        setTimeout(() => router.push("/login"), 2500);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(
          err?.response?.data?.error ||
            "Verification failed. The link may have expired.",
        );
      });
  }, [token, router]);

  if (token) {
    return (
      <div className="card text-center">
        <div className="flex justify-center mb-4">
          {status === "loading" && (
            <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center">
              <Spinner size={28} className="text-blue-400" />
            </div>
          )}
          {status === "success" && (
            <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center">
              <CheckCircle className="text-green-400" size={28} />
            </div>
          )}
          {status === "error" && (
            <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center">
              <XCircle className="text-red-400" size={28} />
            </div>
          )}
        </div>

        <h1 className="text-xl font-bold text-white mb-2">
          {status === "loading"
            ? "Verifying..."
            : status === "success"
              ? "Email Verified!"
              : "Verification Failed"}
        </h1>
        <p className="text-slate-400 text-sm mb-6">
          {message || "Checking your verification link..."}
        </p>

        {status === "success" && (
          <div className="flex items-center justify-center gap-1.5 text-sm text-blue-400">
            <Spinner size={14} /> Redirecting to login...
          </div>
        )}
        {status === "error" && (
          <Link
            href="/login"
            className="btn-primary inline-flex items-center gap-2"
          >
            <MailCheck size={16} /> Back to Login
          </Link>
        )}
      </div>
    );
  }

  return <CodeVerifyForm initialEmail={emailParam} />;
}

function CodeVerifyForm({ initialEmail }: { initialEmail: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !code) {
      setError("Enter the email address and the 6-digit code.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authApi.verifyEmailCode(email, code.trim());
      setVerified(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          "Invalid or expired code. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (verified) {
    return (
      <div className="card text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center">
            <CheckCircle className="text-green-400" size={28} />
          </div>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Email Verified!</h1>
        <p className="text-slate-400 text-sm mb-6">
          You can now log in to your account.
        </p>
        <div className="flex items-center justify-center gap-1.5 text-sm text-blue-400">
          <Spinner size={14} /> Redirecting to login...
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center">
          <MailCheck className="text-blue-400" size={28} />
        </div>
      </div>
      <h1 className="text-xl font-bold text-white mb-2 text-center">
        Verify your email
      </h1>
      <p className="text-slate-400 text-sm mb-6 text-center">
        {initialEmail
          ? `We sent a verification link and a 6-digit code to ${initialEmail}. Enter the code below, or use the link from your inbox.`
          : "Enter your email and the 6-digit code we sent you."}
      </p>

      {error && (
        <div className="mb-5">
          <ErrorAlert message={error} />
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div>
          <label className="label">Email address</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="you@example.com"
            className="input"
            autoComplete="email"
            readOnly={Boolean(initialEmail)}
          />
        </div>
        <div>
          <label className="label">Verification code</label>
          <input
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            type="text"
            inputMode="numeric"
            placeholder="123456"
            className="input tracking-widest text-center text-lg"
            autoComplete="one-time-code"
            maxLength={6}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full h-11 text-base"
        >
          {loading ? <Spinner size={18} /> : null}
          {loading ? "Verifying..." : "Verify Email"}
        </button>
      </form>

      <p className="text-center text-slate-400 text-sm mt-7">
        Already verified?{" "}
        <Link
          href="/login"
          className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
