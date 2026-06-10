"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Download, AlertCircle } from "lucide-react";
import Link from "next/link";
import QRCode from "qrcode";

interface BookingData {
  organizationId: string;
  organizationName: string;
  organizationType: string;
  fees: number;
  department: { name: string; id: string };
  date: {
    fullDate: string;
    dayName: string;
    dayNumber: number;
    month: string;
    year: number;
  };
  timeSlot: { display: string; startTime: string; endTime: string };
  user: { fullName: string; email: string; phoneNumber: string };
  bookingTime: string;
}

export default function AppointmentSuccess() {
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [qrError, setQrError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored =
      sessionStorage.getItem("bookingData") ||
      localStorage.getItem("bookingData");

    if (stored) {
      try {
        const parsed: BookingData = JSON.parse(stored);
        setBookingData(parsed);
      } catch (e) {
        console.error("Parse error:", e);
        setQrError("Failed to load booking data");
      }
    } else {
      console.warn("No bookingData found in sessionStorage or localStorage");
      setQrError(
        "No booking data found. Your appointment was still booked successfully.",
      );
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!bookingData) return;

    const qrContent = [
      `=== APPOINTMENT DETAILS ===`,
      `Organization: ${bookingData.organizationName}`,
      `Type: ${bookingData.organizationType}`,
      `Department: ${bookingData.department.name}`,
      `Date: ${bookingData.date.dayName}, ${bookingData.date.dayNumber} ${bookingData.date.month} ${bookingData.date.year}`,
      `Time: ${bookingData.timeSlot.display}`,
      `Client: ${bookingData.user.fullName}`,
      `Email: ${bookingData.user.email}`,
      `Phone: ${bookingData.user.phoneNumber}`,
      `Fees: Rs. ${bookingData.fees}`,
      `Booked: ${new Date(bookingData.bookingTime).toLocaleString()}`,
    ].join("\n");

    QRCode.toDataURL(qrContent, {
      width: 280,
      margin: 2,
      color: { dark: "#1a1a1a", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        setQrDataUrl(url);
        sessionStorage.removeItem("bookingData");
        localStorage.removeItem("bookingData");
      })
      .catch((err) => {
        console.error("QR generation failed:", err);
        setQrError("Failed to generate QR code");
      });
  }, [bookingData]);

  const handleDownload = () => {
    if (!qrDataUrl || !bookingData) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `appointment-${bookingData.user.fullName.replace(/\s+/g, "-")}-${bookingData.date.fullDate}.png`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white-50 flex items-center justify-center px-1">
      <div className="max-w-2xl w-full">
        <div className="bg-white border border-gray-200 rounded-3xl shadow-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Appointment Confirmed!
          </h1>
          <p className="text-gray-600 mb-6">
            Scan the QR code below at the venue for verification.
          </p>

          {/* QR Code Section */}
          <div className="bg-fuchsia-100 rounded-2xl p-5 mb-5 flex flex-col items-center gap-3">
            {qrError ? (
              <div className="flex items-center gap-2 text-amber-600 text-sm p-3 bg-amber-50 rounded-xl">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{qrError}</span>
              </div>
            ) : qrDataUrl ? (
              <>
                <img
                  src={qrDataUrl}
                  alt="Appointment QR Code"
                  className="rounded-xl w-[250px] h-[250px]"
                />
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 bg-[#B61BE1] text-white font-semibold py-2 px-5 rounded-xl hover:opacity-90 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download QR
                </button>
              </>
            ) : (
              <div className="w-[250px] h-[250px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
              </div>
            )}
          </div>

          {/* Booking Summary */}
          {bookingData && (
            <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left text-sm space-y-1">
              <p>
                <span className="font-semibold">Organization:</span>{" "}
                {bookingData.organizationName}
              </p>
              <p>
                <span className="font-semibold">Department:</span>{" "}
                {bookingData.department.name}
              </p>
              <p>
                <span className="font-semibold">Date:</span>{" "}
                {bookingData.date.dayName}, {bookingData.date.dayNumber}{" "}
                {bookingData.date.month} {bookingData.date.year}
              </p>
              <p>
                <span className="font-semibold">Time:</span>{" "}
                {bookingData.timeSlot.display}
              </p>
              <p>
                <span className="font-semibold">Fees:</span> Rs.{" "}
                {bookingData.fees}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Link
              href="/user/history"
              className="block w-full bg-[#B61BE1] text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-all duration-300"
            >
              View My Appointments
            </Link>
            <Link
              href="/user/organizations"
              className="block w-full bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-200 transition-all duration-300"
            >
              Book Another Appointment
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
