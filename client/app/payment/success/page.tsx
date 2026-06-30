"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/context/authContext";
import { toast } from "sonner";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<"loading" | "success">("loading");

  useEffect(() => {
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      toast.error("No payment session found");
      router.push("/courses");
      return;
    }

    // Refresh user to get updated enrolled courses
    refreshUser().then(() => {
      setStatus("success");
      toast.success("🎉 Payment successful! You are now enrolled.");

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    });
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
              You now have access to your course. Redirecting to dashboard...
            </p>
            <div className="flex items-center justify-center gap-1.5 text-sm text-blue-400">
              <Loader2 size={14} className="animate-spin" /> Redirecting...
            </div>
          </>
        )}
      </div>
    </div>
  );
}
