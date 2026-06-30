"use client";
import { useEffect, useState } from "react";
import { X, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/authContext";
import { useRouter } from "next/navigation";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseTitle: string;
  courseId: string;
  amount: number;
  onSuccess?: () => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  courseTitle,
  courseId,
  amount,
  onSuccess,
}: PaymentModalProps) {
  const [status, setStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStatus("idle");
      setErrorMessage("");
    }
  }, [isOpen]);

  const handlePayment = async () => {
    if (!user) {
      setStatus("error");
      setErrorMessage("Please log in to purchase courses");
      return;
    }

    setStatus("processing");

    try {
      // Use checkout endpoint
      const response = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ courseId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Payment initiation failed");
      }

      // If free course
      if (data.url.includes("/dashboard")) {
        setStatus("success");
        await refreshUser();
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
          router.push("/dashboard");
        }, 2000);
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Payment failed. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Confirm Purchase</h2>
          {status !== "processing" && status !== "success" && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          {status === "idle" && (
            <>
              <div className="mb-6">
                <p className="text-slate-300 text-sm">
                  You are about to purchase:
                </p>
                <h3 className="text-white font-semibold text-lg mt-1">
                  {courseTitle}
                </h3>
                <p className="text-2xl font-bold text-blue-400 mt-3">
                  {amount === 0 ? "Free" : `$${(amount / 100).toFixed(2)}`}
                </p>
              </div>

              <div className="bg-slate-700/30 rounded-xl p-4 mb-6">
                <p className="text-xs text-slate-400">
                  🔒 Secure payment powered by Stripe. Your payment information
                  is encrypted and secure.
                </p>
              </div>

              <button
                onClick={handlePayment}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {amount === 0
                  ? "Enroll Now"
                  : `Pay $${(amount / 100).toFixed(2)}`}
              </button>

              <button
                onClick={onClose}
                className="w-full mt-2 text-slate-400 hover:text-white text-sm py-2 transition-colors"
              >
                Cancel
              </button>
            </>
          )}

          {status === "processing" && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 size={28} className="text-blue-400 animate-spin" />
              </div>
              <h3 className="text-white font-semibold">
                Processing payment...
              </h3>
              <p className="text-slate-400 text-sm mt-2">
                Please wait while we redirect you to Stripe.
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-green-400" />
              </div>
              <h3 className="text-white font-semibold">Success! 🎉</h3>
              <p className="text-slate-400 text-sm mt-2">
                You are now enrolled in this course.
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={28} className="text-red-400" />
              </div>
              <h3 className="text-white font-semibold">Payment failed</h3>
              <p className="text-red-400 text-sm mt-2">{errorMessage}</p>
              <button
                onClick={() => setStatus("idle")}
                className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
