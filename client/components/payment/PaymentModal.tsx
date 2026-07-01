"use client";
import { useState, useCallback } from "react";
import {
  X,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Lock,
  BookOpen,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useAuth } from "@/context/authContext";
import { paymentApi } from "@/lib/api";
import { toast } from "sonner";

// ── NPR formatter ─────────────────────────────────────────────────────────────
const formatNPR = (paise: number): string =>
  `NPR ${(paise / 100).toLocaleString("ne-NP", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// ── Stripe appearance (dark slate theme to match GyanKosh UI) ─────────────────
const STRIPE_APPEARANCE = {
  theme: "night" as const,
  variables: {
    colorPrimary: "#3b82f6",
    colorBackground: "#1e293b",
    colorText: "#f1f5f9",
    colorDanger: "#f87171",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    borderRadius: "10px",
    focusBoxShadow: "none",
  },
  rules: {
    ".Input": {
      backgroundColor: "#0f172a",
      border: "1px solid #334155",
    },
    ".Input:focus": {
      border: "1px solid #3b82f6",
    },
    ".Label": {
      color: "#94a3b8",
      fontSize: "12px",
    },
  },
};

// ── Inner form — uses Stripe hooks, must be inside <Elements> ─────────────────
interface InnerFormProps {
  courseTitle: string;
  amountCents: number;
  isFree: boolean;
  onSuccess: () => void;
  onError: (msg: string) => void;
  onProcessing: (v: boolean) => void;
}

function PaymentForm({
  courseTitle,
  amountCents,
  isFree,
  onSuccess,
  onError,
  onProcessing,
}: InnerFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!stripe || !elements) return;
    setIsSubmitting(true);
    onProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      onError(error.message ?? "Payment failed. Please try again.");
      setIsSubmitting(false);
      onProcessing(false);
      return;
    }

    // No error + redirect: "if_required" means payment succeeded in-page
    onSuccess();
    setIsSubmitting(false);
    onProcessing(false);
  }, [stripe, elements, onSuccess, onError, onProcessing]);

  if (isFree) {
    // Free courses don't render the card form — handled before <Elements> mount
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Order summary */}
      <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <BookOpen size={14} className="text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 mb-0.5">Enrolling in</p>
            <p className="text-sm font-semibold text-white leading-snug line-clamp-2">
              {courseTitle}
            </p>
          </div>
          <div className="text-right flex-shrink-0 pl-2">
            <p className="text-sm font-bold text-white">
              {formatNPR(amountCents)}
            </p>
            <p className="text-xs text-slate-500">NPR</p>
          </div>
        </div>
      </div>

      {/* Stripe Payment Element */}
      <div>
        <PaymentElement
          options={{
            layout: { type: "tabs", defaultCollapsed: false },
            fields: { billingDetails: { address: "never" } },
          }}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !stripe || !elements}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
      >
        {isSubmitting ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <Lock size={14} />
            Pay {formatNPR(amountCents)} securely
          </>
        )}
      </button>

      <p className="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
        <Lock size={10} className="text-slate-600" />
        Secured by Stripe · Your card details are never stored
      </p>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseTitle: string;
  courseId: string;
  amount: number; // priceCents from DB
  onSuccess?: () => void;
}

type ModalState =
  | "idle"
  | "loading"
  | "ready"
  | "processing"
  | "success"
  | "error";

export function PaymentModal({
  isOpen,
  onClose,
  courseTitle,
  courseId,
  amount,
  onSuccess,
}: PaymentModalProps) {
  const [state, setState] = useState<ModalState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<ReturnType<
    typeof loadStripe
  > | null>(null);
  const { user, refreshUser } = useAuth();

  // Triggered when user clicks "Enroll Now" / "Pay Now"
  const initiatePayment = useCallback(async () => {
    if (!user) {
      toast.error("Please log in to purchase courses");
      return;
    }

    setState("loading");
    setErrorMsg("");

    try {
      const data = await paymentApi.createCheckout(courseId);

      // Free course — enrolled immediately by the server
      if (data.clientSecret === "free") {
        setState("success");
        await refreshUser();
        toast.success("🎉 Enrolled successfully!");
        onSuccess?.();
        return;
      }

      // Paid course — mount Stripe Payment Element
      const stripe = loadStripe(data.publishableKey);
      setStripePromise(stripe);
      setClientSecret(data.clientSecret);
      setState("ready");
    } catch (err: any) {
      const msg =
        err.response?.data?.error || err.message || "Could not start payment.";
      setErrorMsg(msg);
      setState("error");
    }
  }, [user, courseId, refreshUser, onSuccess]);

  const handlePaymentSuccess = useCallback(async () => {
    setState("success");
    await refreshUser();
    toast.success("🎉 Payment successful! You are now enrolled.");
    onSuccess?.();
  }, [refreshUser, onSuccess]);

  const handlePaymentError = useCallback((msg: string) => {
    setErrorMsg(msg);
    setState("error");
  }, []);

  const handleReset = useCallback(() => {
    setState("idle");
    setErrorMsg("");
    setClientSecret(null);
    setStripePromise(null);
  }, []);

  const handleClose = useCallback(() => {
    if (state === "processing") return; // don't close mid-payment
    handleReset();
    onClose();
  }, [state, handleReset, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <CreditCard size={14} className="text-blue-400" />
            </div>
            <h2 className="text-sm font-semibold text-white">
              {state === "success" ? "Enrolled!" : "Complete Purchase"}
            </h2>
          </div>
          {state !== "processing" && (
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-700"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-5">
          {/* IDLE — confirm screen */}
          {state === "idle" && (
            <div>
              <p className="text-slate-400 text-sm mb-2">
                You&apos;re enrolling in:
              </p>
              <h3 className="text-white font-semibold mb-4">{courseTitle}</h3>
              <div className="flex items-baseline gap-2 mb-5">
                <span className="text-3xl font-bold text-white">
                  {amount === 0 ? "Free" : formatNPR(amount)}
                </span>
                {amount > 0 && (
                  <span className="text-sm text-slate-500">NPR</span>
                )}
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 mb-5">
                <p className="text-xs text-blue-300 flex items-start gap-2">
                  <Lock size={12} className="flex-shrink-0 mt-0.5" />
                  Payment secured by Stripe. Card details encrypted end-to-end.
                </p>
              </div>
              <button
                onClick={initiatePayment}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                {amount === 0 ? "Enroll Free" : `Pay ${formatNPR(amount)}`}
              </button>
              <button
                onClick={handleClose}
                className="w-full mt-2 text-slate-500 hover:text-slate-300 text-sm py-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {/* LOADING — fetching client secret */}
          {state === "loading" && (
            <div className="text-center py-10">
              <span className="inline-block w-8 h-8 border-2 border-blue-600/30 border-t-blue-500 rounded-full animate-spin mb-4" />
              <p className="text-slate-300 text-sm">
                Preparing secure payment…
              </p>
            </div>
          )}

          {/* READY — Stripe Payment Element mounted */}
          {state === "ready" && clientSecret && stripePromise && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: STRIPE_APPEARANCE,
                locale: "en",
              }}
            >
              <PaymentForm
                courseTitle={courseTitle}
                amountCents={amount}
                isFree={false}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                onProcessing={(v) => setState(v ? "processing" : "ready")}
              />
            </Elements>
          )}

          {/* PROCESSING */}
          {state === "processing" && (
            <div className="text-center py-10">
              <span className="inline-block w-8 h-8 border-2 border-blue-600/30 border-t-blue-500 rounded-full animate-spin mb-4" />
              <p className="text-white font-medium text-sm">
                Processing payment…
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Please don&apos;t close this window
              </p>
            </div>
          )}

          {/* SUCCESS */}
          {state === "success" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={30} className="text-green-400" />
              </div>
              <h3 className="text-white font-bold text-lg mb-1">
                You&apos;re enrolled! 🎉
              </h3>
              <p className="text-slate-400 text-sm mb-5">
                You now have full access to{" "}
                <span className="text-white font-medium">{courseTitle}</span>
              </p>
              <button
                onClick={handleClose}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                Start Learning
              </button>
            </div>
          )}

          {/* ERROR */}
          {state === "error" && (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={26} className="text-red-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Payment failed</h3>
              <p className="text-red-400 text-sm mb-5">{errorMsg}</p>
              <button
                onClick={handleReset}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
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
