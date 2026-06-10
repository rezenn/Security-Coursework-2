"use client";

import { useState } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { Lock } from "lucide-react";

interface StripeCardFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  amount: number;
  isSubmitting: boolean;
}

export default function StripeCardForm({
  onSuccess,
  onCancel,
  amount,
  isSubmitting,
}: StripeCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [elementReady, setElementReady] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements || !elementReady) return;

    setProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || "Please check your card details");
      setProcessing(false);
      return;
    }

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message || "Payment failed");
      setProcessing(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      onSuccess();
    } else {
      setError("Payment was not completed. Please try again.");
      setProcessing(false);
    }
  };

  const isLoading = processing || isSubmitting;
  const isDisabled = !stripe || !elements || !elementReady || isLoading;

  return (
    <div className="space-y-4">
      <PaymentElement
        onReady={() => setElementReady(true)}
        onLoadError={(e) =>
          setError("Failed to load payment form. Please refresh.")
        }
        options={{
          layout: "tabs",
          paymentMethodOrder: ["card"],
          terms: { card: "never" },
        }}
      />

      {!elementReady && (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
          <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          <span>Loading payment form...</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
        <Lock className="w-3 h-3 shrink-0" />
        <span>
          Secured by Stripe. Your card details are never stored on our servers.
        </span>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={handlePay}
          disabled={isDisabled}
          className="flex-1 bg-[#B61BE1] text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {isSubmitting ? "Booking..." : "Processing..."}
            </span>
          ) : !elementReady ? (
            "Loading..."
          ) : (
            `Pay Rs. ${amount} & Confirm`
          )}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-5 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
