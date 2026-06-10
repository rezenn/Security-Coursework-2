"use client";

import { useEffect, useState } from "react";
import { useSessionStorage } from "./hooks/useSessionStorage";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Building2,
  User,
  Mail,
  Phone,
  Tag,
  ArrowLeft,
  CheckCircle,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import {
  createAppointment,
  CreateAppointmentData,
  createPaymentIntent,
  markAppointmentPaid,
} from "@/lib/api/appointment/appointment";

import StripeCardForm from "./_components/StripecardForm";
import { toast } from "sonner";
import { useAuth } from "@/context/authContext";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

const stripeAppearance = {
  theme: "stripe" as const,
  variables: {
    colorPrimary: "#B61BE1",
    colorBackground: "#ffffff",
    colorText: "#2D3436",
    colorDanger: "#ef4444",
    fontFamily: "inherit",
    borderRadius: "12px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": {
      border: "1.2px solid #DDD8FF",
      boxShadow: "none",
      backgroundColor: "#ffffff",
      color: "#2D3436",
    },
    ".Input:focus": {
      border: "1.8px solid #B61BE1",
      boxShadow: "none",
    },
    ".Label": { color: "#636E72", fontWeight: "500" },
    ".Tab": { border: "1px solid #DDD8FF", backgroundColor: "#ffffff" },
    ".Tab--selected": {
      border: "1.5px solid #B61BE1",
      backgroundColor: "#F5F4FF",
    },
    ".Block": { backgroundColor: "#F5F4FF", border: "1px solid #DDD8FF" },
  },
};

interface BookingData {
  organizationId: string;
  organizationName: string;
  organizationType: string;
  fees: number;
  department: { name: string; id: string };
  date: {
    display: string;
    fullDate: string;
    dayName: string;
    dayNumber: number;
    month: string;
    year: number;
  };
  timeSlot: { display: string; startTime: string; endTime: string };
  user: { id: string; fullName: string; email: string; phoneNumber: string };
  bookingTime: string;
}

export default function BookingConfirmation() {
  const router = useRouter();
  const { user } = useAuth();

  const [bookingData, setBookingData] =
    useSessionStorage<BookingData>("bookingData");
  const [isLoading, setIsLoading] = useState(true);
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [showStripeForm, setShowStripeForm] = useState(false);
  const [createdAppointmentId, setCreatedAppointmentId] = useState<
    string | null
  >(null);
  const [loadingIntent, setLoadingIntent] = useState(false);

  useEffect(() => {
    const storedData = sessionStorage.getItem("bookingData");
    if (storedData) {
      try {
        setBookingData(JSON.parse(storedData));
      } catch (e) {
        toast.error("Invalid booking data");
        router.push("/user/organizations");
      }
    }
    setIsLoading(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingData) return;

    if (!bookingData.department?.id) {
      toast.error("Department ID is missing. Please go back and try again.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const appointmentData: CreateAppointmentData = {
        organizationId: bookingData.organizationId,
        departmentId: bookingData.department.id,
        date: bookingData.date.fullDate,
        timeslot: {
          startTime: bookingData.timeSlot.startTime,
          endTime: bookingData.timeSlot.endTime,
        },
        clientName: bookingData.user.fullName,
        clientEmail: bookingData.user.email,
        clientPhoneNumber: bookingData.user.phoneNumber,
        notes: note || undefined,
        paymentMethod: paymentMethod as "online" | "cash",
        paymentAmount: bookingData.fees,
      };

      const response = await createAppointment(appointmentData);

      if (!response.success) {
        setError(response.message || "Failed to book appointment");
        toast.error(response.message || "Failed to book appointment");
        setIsSubmitting(false);
        return;
      }

      const appointmentId = response.data?._id;

      if (paymentMethod === "cash") {
        toast.success("Appointment booked successfully!");
        router.push("/user/appointment/success");
        return;
      }

      if (bookingData.fees <= 0) {
        // Free appointment — no payment needed
        toast.success("Appointment booked successfully!");
        router.push("/user/appointment/success");
        return;
      }

      setCreatedAppointmentId(appointmentId);
      setLoadingIntent(true);

      const secret = await createPaymentIntent(bookingData.fees, appointmentId);
      setClientSecret(secret);
      setShowStripeForm(true);
      setLoadingIntent(false);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to book appointment";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = async () => {
    if (createdAppointmentId) {
      await markAppointmentPaid(createdAppointmentId);
    }
    toast.success("Payment successful! Appointment confirmed.");
    router.push("/user/appointment/success");
  };

  const handlePaymentCancel = () => {
    setShowStripeForm(false);
    setClientSecret(null);
    toast.info("Payment skipped. Your appointment is booked but unpaid.");
    router.push("/user/appointment/success");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-gray-100 shadow-2xl">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            No Booking Data Found
          </h2>
          <p className="text-gray-600 mb-6">
            Please select an appointment time before proceeding.
          </p>
          <Link
            href="/user/organizations"
            className="inline-block bg-[#B61BE1] text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-all duration-300"
          >
            Browse Organizations
          </Link>
        </div>
      </div>
    );
  }

  const fullDate = `${bookingData.date.dayName}, ${bookingData.date.dayNumber} ${bookingData.date.month} ${bookingData.date.year}`;

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Link
          href={`/user/organization/${bookingData.organizationId}`}
          className="w-25 bg-[#B61BE1] text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg mb-6"
          style={{ width: "fit-content" }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {showStripeForm ? "Complete Payment" : "Confirm Your Appointment"}
          </h1>
          <p className="text-gray-600">
            {showStripeForm
              ? "Enter your card details to complete the booking"
              : "Please review your appointment details before confirming"}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Organization Header */}
          <div className="bg-[linear-gradient(to_left,#BDDCFF_0%,#BCC2FB_13%,#BA7BF0_50%,#B846E8_78%,#B61BE1_100%)] px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 rounded-full p-3">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {bookingData.organizationName}
                </h2>
                <p className="text-purple-100 capitalize">
                  {bookingData.organizationType}
                </p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {showStripeForm && clientSecret ? (
              <div>
                {/* Mini summary */}
                <div className="bg-purple-50 rounded-xl p-4 mb-6 text-sm space-y-1">
                  <p>
                    <span className="font-semibold">Department:</span>{" "}
                    {bookingData.department.name}
                  </p>
                  <p>
                    <span className="font-semibold">Date:</span> {fullDate}
                  </p>
                  <p>
                    <span className="font-semibold">Time:</span>{" "}
                    {bookingData.timeSlot.display}
                  </p>
                  <p className="text-[#B61BE1] font-semibold text-base">
                    Amount: Rs. {bookingData.fees}
                  </p>
                </div>

                <div className="flex items-center gap-2 mb-5">
                  <CreditCard className="w-5 h-5 text-[#B61BE1]" />
                  <h3 className="font-semibold text-gray-900">Card Payment</h3>
                </div>

                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: stripeAppearance,
                    loader: "auto",
                  }}
                >
                  <StripeCardForm
                    onSuccess={handlePaymentSuccess}
                    onCancel={handlePaymentCancel}
                    amount={bookingData.fees}
                    isSubmitting={isSubmitting}
                  />
                </Elements>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <div className="bg-purple-50 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Tag className="w-5 h-5 text-purple-600" />
                      <h3 className="font-semibold text-gray-900">
                        Department
                      </h3>
                    </div>
                    <p className="text-gray-700 ml-8">
                      {bookingData.department.name}
                    </p>
                  </div>

                  <div className="bg-pink-50 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-5 h-5 text-pink-600" />
                      <h3 className="font-semibold text-gray-900">Date</h3>
                    </div>
                    <p className="text-gray-700 ml-8">{fullDate}</p>
                  </div>

                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900">Time</h3>
                    </div>
                    <p className="text-gray-700 ml-8">
                      {bookingData.timeSlot.display}
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-gray-900">Client</h3>
                    </div>
                    <p className="text-gray-700 ml-8">
                      {bookingData.user.fullName}
                    </p>
                  </div>
                </div>

                {/* Client Details */}
                <div className="border-t border-gray-200 pt-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Client Information
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">
                        {bookingData.user.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">
                        {bookingData.user.phoneNumber}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 mb-8">
                  {/* Notes */}
                  <div>
                    <label
                      htmlFor="note"
                      className="block text-md font-medium text-gray-700 mb-2"
                    >
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      id="note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none bg-white text-gray-900"
                      placeholder="Please enter any special requests or notes..."
                    />
                  </div>

                  {/* Payment Method */}
                  <div>
                    <div className="bg-gray-50 rounded-xl p-4 mb-3">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">Payment</h3>
                      </div>
                      <div className="flex flex-row items-center">
                        <Tag className="w-5 h-5 text-gray-600" />
                        <p className="text-gray-700 ml-2">
                          Rs. {bookingData.fees}
                        </p>
                      </div>
                    </div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Payment Method
                    </h3>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cash"
                          checked={paymentMethod === "cash"}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-gray-700">Cash</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="online"
                          checked={paymentMethod === "online"}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-gray-700">
                          Online (Card via Stripe)
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    {error}
                  </div>
                )}

                {/* Loading intent spinner (between submit and Stripe form) */}
                {loadingIntent && (
                  <div className="mb-6 flex items-center gap-3 text-purple-600">
                    <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Loading payment form...</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting || loadingIntent}
                    className="flex-1 bg-[#B61BE1] text-white font-semibold py-4 px-6 rounded-xl hover:opacity-90 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isSubmitting || loadingIntent ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {loadingIntent ? "Loading Payment..." : "Processing..."}
                      </span>
                    ) : paymentMethod === "online" ? (
                      `Continue to Payment`
                    ) : (
                      "Confirm Appointment"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/user/organization/${bookingData.organizationId}`,
                      )
                    }
                    disabled={isSubmitting || loadingIntent}
                    className="flex-1 bg-gray-100 text-gray-700 font-semibold py-4 px-6 rounded-xl hover:bg-gray-200 transition-all duration-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          By confirming this appointment, you agree to our{" "}
          <span className="text-purple-600 hover:underline cursor-pointer">
            terms and conditions
          </span>
        </p>
      </div>
    </div>
  );
}
