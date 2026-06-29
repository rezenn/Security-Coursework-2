"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { paymentApi } from "@/lib/api";
import { useAuth } from "@/context/authContext";
import Link from "next/link";

export default function PaymentVerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [courseTitle, setCourseTitle] = useState("");

  useEffect(() => {
    const pidx = searchParams.get("pidx");
    const txnStatus = searchParams.get("status");

    if (!pidx) {
      setStatus("error");
      setMessage("No payment reference found.");
      return;
    }
    if (txnStatus === "User canceled") {
      setStatus("error");
      setMessage("Payment was cancelled. No charges were made.");
      return;
    }

    paymentApi.verify(pidx)
      .then((data) => {
        setCourseTitle(data.courseTitle || "your course");
        setStatus("success");
        refreshUser();
        setTimeout(() => router.push("/dashboard"), 3000);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(
          err?.response?.data?.error ||
          "Payment verification failed. Contact support if amount was deducted.",
        );
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-10 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-5">
              <Loader2 size={28} className="text-blue-400 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Verifying payment</h2>
            <p className="text-slate-400 text-sm">Please wait while we confirm your payment with Khalti...</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={28} className="text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Payment successful!</h2>
            <p className="text-slate-400 text-sm mb-6">
              You now have access to <strong className="text-white">{courseTitle}</strong>.
            </p>
            <div className="flex items-center justify-center gap-1.5 text-sm text-blue-400">
              <Loader2 size={14} className="animate-spin" /> Redirecting to dashboard...
            </div>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-5">
              <XCircle size={28} className="text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Payment failed</h2>
            <p className="text-slate-400 text-sm mb-6">{message}</p>
            <div className="flex flex-col gap-3">
              <Link href="/courses" className="btn-primary w-full text-center">Browse Courses</Link>
              <Link href="/dashboard" className="btn-secondary w-full text-center">Go to Dashboard</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
