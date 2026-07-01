"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MailCheck, CheckCircle, XCircle } from "lucide-react";
import { authApi } from "@/lib/api";
import { Spinner } from "@/components/shared";
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
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found.");
      return;
    }
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
