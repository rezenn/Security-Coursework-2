"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useAuth } from "@/context/authContext";
import Link from "next/link";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const [courseTitle, setCourseTitle] = useState("");

  useEffect(() => {
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      setStatus("error");
      setMessage("No payment session found.");
      return;
    }

    // Check if session_id starts with "free_" (free course)
    if (sessionId.startsWith("free_")) {
      setStatus("success");
      setCourseTitle("your free course");
      refreshUser();
      setTimeout(() => router.push("/dashboard"), 3000);
      return;
    }

    // For paid courses, the webhook will handle the completion
    // We just show success and let the webhook do the rest
    setStatus("success");
    setCourseTitle("your course");
    refreshUser();

    // Redirect to dashboard after 5 seconds
    setTimeout(() => router.push("/dashboard"), 5000);
  }, [searchParams, router, refreshUser]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-10 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-5">
              <Loader2 size={28} className="text-blue-400 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Processing payment
            </h2>
            <p className="text-slate-400 text-sm">
              Please wait while we confirm your payment...
            </p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={28} className="text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Payment successful! 🎉
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              You now have access to{" "}
              <strong className="text-white">{courseTitle}</strong>.
            </p>
            <div className="flex items-center justify-center gap-1.5 text-sm text-blue-400">
              <Loader2 size={14} className="animate-spin" /> Redirecting to
              dashboard...
            </div>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-5">
              <XCircle size={28} className="text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Payment verification failed
            </h2>
            <p className="text-slate-400 text-sm mb-6">{message}</p>
            <div className="flex flex-col gap-3">
              <Link href="/courses" className="btn-primary w-full text-center">
                Browse Courses
              </Link>
              <Link
                href="/dashboard"
                className="btn-secondary w-full text-center"
              >
                Go to Dashboard
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
