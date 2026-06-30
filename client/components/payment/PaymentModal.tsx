"use client";
import { useState } from "react";
import { X, Loader2, CreditCard, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/authContext";
import { paymentApi } from "@/lib/api";
import { toast } from "sonner";

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const { user, refreshUser } = useAuth();

  if (!isOpen) return null;

  const handlePayment = async () => {
    if (!user) {
      setStatus("error");
      setErrorMessage("Please log in to purchase courses");
      return;
    }

    setIsProcessing(true);
    setStatus("processing");

    try {
      const data = await paymentApi.createCheckout(courseId);

      // If free course
      if (data.url && data.url.includes("/dashboard")) {
        setStatus("success");
        await refreshUser();
        toast.success("Course enrolled successfully!");
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 2000);
        return;
      }

      // Redirect to Stripe Checkout (opens in new tab/window)
      window.open(data.url, "_blank");

      // Close modal after redirect
      setTimeout(() => {
        onClose();
        toast.success("Payment window opened. Complete your payment there.");
      }, 500);
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(
        err.response?.data?.error ||
          err.message ||
          "Payment failed. Please try again.",
      );
      setIsProcessing(false);
    }
  };

  const handleTryAgain = () => {
    setStatus("idle");
    setErrorMessage("");
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-blue-400" />
            <h2 className="text-base font-semibold text-white">
              Complete Purchase
            </h2>
          </div>
          {status !== "processing" && status !== "success" && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-5">
          {status === "idle" && (
            <>
              <div className="mb-5">
                <p className="text-slate-400 text-sm mb-1">
                  You are about to purchase:
                </p>
                <h3 className="text-white font-semibold text-base">
                  {courseTitle}
                </h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-white">
                    {amount === 0 ? "Free" : `$${(amount / 100).toFixed(2)}`}
                  </span>
                  {amount > 0 && (
                    <span className="text-xs text-slate-500">USD</span>
                  )}
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-5">
                <p className="text-xs text-blue-400 flex items-start gap-2">
                  <span>🔒</span>
                  <span>
                    Secure payment powered by Stripe. Your card details are
                    encrypted.
                  </span>
                </p>
              </div>

              <button
                onClick={handlePayment}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {amount === 0
                  ? "Enroll Now"
                  : `Pay $${(amount / 100).toFixed(2)}`}
              </button>

              <button
                onClick={onClose}
                className="w-full mt-2 text-slate-500 hover:text-white text-sm py-2 transition-colors"
              >
                Cancel
              </button>
            </>
          )}

          {status === "processing" && (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 size={24} className="text-blue-400 animate-spin" />
              </div>
              <h3 className="text-white font-semibold">Opening payment...</h3>
              <p className="text-slate-400 text-sm mt-2">
                You'll be redirected to Stripe to complete your payment.
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={24} className="text-green-400" />
              </div>
              <h3 className="text-white font-semibold">Success! 🎉</h3>
              <p className="text-slate-400 text-sm mt-2">
                You are now enrolled in{" "}
                <strong className="text-white">{courseTitle}</strong>
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={24} className="text-red-400" />
              </div>
              <h3 className="text-white font-semibold">Payment failed</h3>
              <p className="text-red-400 text-sm mt-2">{errorMessage}</p>
              <button
                onClick={handleTryAgain}
                className="mt-4 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
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
