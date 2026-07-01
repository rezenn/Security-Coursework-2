"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2, BookOpen } from "lucide-react";
import { useAuth } from "@/context/authContext";
import Link from "next/link";

// This page is a fallback landing for any redirect-based payment completion.
// The primary Payment Element flow completes in-modal without navigating here.
export default function PaymentSuccessPage() {
  const router = useRouter();
  const { refreshUser, user } = useAuth();
  const [status, setStatus] = useState<"loading" | "success">("loading");

  useEffect(() => {
    // Refresh user to pick up any newly enrolled courses from the webhook
    refreshUser()
      .catch(() => {
        /* ignore — user may not be logged in */
      })
      .finally(() => setStatus("success"));
  }, [refreshUser]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-10 max-w-md w-full text-center">
        {status === "loading" ? (
          <>
            <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-5">
              <Loader2 size={28} className="text-blue-400 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Confirming payment…
            </h2>
            <p className="text-slate-400 text-sm">Please wait a moment.</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={32} className="text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Payment successful! 🎉
            </h2>
            <p className="text-slate-400 text-sm mb-8">
              {user
                ? `Welcome back, ${user.username}! Your course access is now active.`
                : "Your payment was processed successfully."}
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                <BookOpen size={15} /> Go to My Dashboard
              </Link>
              <Link
                href="/courses"
                className="text-slate-400 hover:text-white text-sm transition-colors py-2"
              >
                Browse more courses
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
