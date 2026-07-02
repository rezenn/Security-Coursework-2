"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, BookOpen } from "lucide-react";
import { useAuth } from "@/context/authContext";
import { paymentApi } from "@/lib/api";
import Link from "next/link";

// This page is a fallback landing for any redirect-based payment completion.
// The primary Payment Element flow completes in-modal without navigating here.
function PaymentSuccessInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<"loading" | "success">("loading");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const completeCheckout = async () => {
      if (sessionId) {
        // Retry a few times: a 401 right after the redirect back from
        // Stripe can just mean the access-token cookie hasn't been
        // (re)hydrated yet, and the webhook can race this call too.
        // Retrying gives both a chance to settle instead of silently
        // leaving the transaction stuck "pending".
        const maxAttempts = 3;
        let lastError: any = null;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            await paymentApi.completeCheckout(sessionId);
            setMessage("Your course access was finalized successfully.");
            lastError = null;
            break;
          } catch (err: any) {
            lastError = err;
            const httpStatus = err?.response?.status;
            const code = err?.response?.data?.error;
            if (httpStatus === 409 || code === "ALREADY_ENROLLED") {
              setMessage("You're already enrolled in this course.");
              lastError = null;
              break;
            }
            if (attempt < maxAttempts) {
              await new Promise((r) => setTimeout(r, attempt * 1000));
            }
          }
        }

        if (lastError) {
          const serverMsg = lastError?.response?.data?.error;
          setMessage(
            serverMsg
              ? `Payment succeeded, but enrollment could not be finalized: ${serverMsg}. Please refresh this page — if it still doesn't work, contact support with your session ID.`
              : "Payment succeeded, but enrollment could not be finalized automatically. Please refresh the page or contact support.",
          );
          // eslint-disable-next-line no-console
          console.error("completeCheckout failed after retries", lastError);
        }
      }

      refreshUser()
        .catch(() => {
          /* ignore */
        })
        .finally(() => setStatus("success"));
    };

    completeCheckout();
  }, [refreshUser, sessionId]);

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
              {message ?? "Your payment was processed successfully."}
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

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-10 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-5">
              <Loader2 size={28} className="text-blue-400 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Loading…</h2>
          </div>
        </div>
      }
    >
      <PaymentSuccessInner />
    </Suspense>
  );
}
