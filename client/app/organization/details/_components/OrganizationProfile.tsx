"use client";

import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Clock,
  Calendar,
  Edit,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import building from "@/app/assets/images/buildingPlaceholder.jpg";
import { OrganizationData } from "@/types/organization.types";
import { useState } from "react";
import { useAuth } from "@/context/authContext";

interface OrganizationProfileProps {
  data: OrganizationData;
}

export default function OrganizationProfile({
  data,
}: OrganizationProfileProps) {
  const [imageError, setImageError] = useState(false);
  const { user } = useAuth();

  const getProfileImageUrl = () => {
    if (!user) return null;

    if (user.imageUrl) {
      return user.imageUrl;
    }

    if (user.profilePicture) {
      return `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api", "")}/uploads/profile/${user.profilePicture}`;
    }

    return null;
  };

  const formatDay = (day: string) => day.charAt(0).toUpperCase() + day.slice(1);

  const daysOrder = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  const profileImageUrl = getProfileImageUrl();
  const sortedWorkingHours = [...data.workingHours].sort(
    (a, b) => daysOrder.indexOf(a.day) - daysOrder.indexOf(b.day),
  );

  return (
    <div className="max-w-6xl mx-auto p-6 min-h-screen">
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6 border border-gray-100">
        <div className="flex items-start justify-between ">
          <div className="flex items-center gap-4">
            <div className="relative w-25 h-25 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
              <div className="relative w-full h-full rounded-full border-3 border-fuchsia-400 shadow-2xl overflow-hidden bg-linear-to-br from-purple-100 to-pink-100">
                {profileImageUrl && !imageError ? (
                  <Image
                    src={profileImageUrl}
                    alt={data.organizationName}
                    fill
                    sizes="80px"
                    className="object-cover rounded-full"
                    unoptimized
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <Image
                    src={building}
                    alt={data.organizationName}
                    fill
                    sizes="80px"
                    className="object-cover rounded-full"
                    loading="eager"
                  />
                )}
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {data.organizationName}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {data.organizationType
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </span>

                {data.isActive ? (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    Active
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>

          <Link
            href="/organization/details/edit"
            className="bg-[#B61BE1] text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <Edit size={18} />
            <span>Edit Details</span>
          </Link>
        </div>

        {data.description && (
          <p className="mt-6 text-gray-600 border-t pt-4">{data.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 ">
        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 ">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Contact Information
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-600">
              <Mail className="w-4 h-4" />
              <span>{data.contactEmail}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Phone className="w-4 h-4" />
              <span>{data.contactPhone || data.user.phoneNumber}</span>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 ">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Location
          </h2>
          <div className="space-y-2 text-gray-600">
            <p>{data.street}</p>
            <p>
              {data.city}, {data.state}
            </p>
          </div>
        </div>
      </div>

      {/* Working Hours */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Working Hours
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sortedWorkingHours.map((hour) => (
            <div
              key={hour._id}
              className={`p-3 rounded-lg ${
                hour.isWorking ? "bg-green-50" : "bg-red-50"
              }`}
            >
              <div className="font-medium text-gray-900">
                {formatDay(hour.day)}
              </div>
              {hour.isWorking ? (
                <div className="text-sm text-gray-600">
                  {hour.openingTime} - {hour.closingTime}
                </div>
              ) : (
                <div className="text-sm text-red-600">Closed</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Departments */}
      {data.departments.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">Departments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.departments.map((dept) => (
              <div
                key={dept._id}
                className="border border-gray-300 bg-blue-50 rounded-lg px-4 py-2"
              >
                <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                {dept.description && (
                  <div>
                    <p className="text-sm text-gray-600 mt-1">
                      {dept.description}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Appointment Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 ">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 ">
          <h2 className="text-xl font-semibold mb-4 ">Appointment Settings</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium">
                {data.appointmentDuration} minutes
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Fees:</span>
              <span className="font-medium">
                Rs.{" "}
                <span className="text-green-600 font-bold">{data.fees}</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Advance Booking:</span>
              <span className="font-medium">
                {data.advanceBookingDays} days
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 ">
          <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Total Time Slots:</span>
              <span className="font-medium">{data.timeSlots.length}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-600">Available Slots:</span>
              <span className=" text-green-600 font-bold">
                {data.timeSlots.filter((slot) => slot.isAvailable).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Departments:</span>
              <span className="font-medium">{data.departments.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Time Slots */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-semibold mb-4">Available Time Slots</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {data.timeSlots.map((slot) => (
            <div
              key={slot._id}
              className={`p-2 text-center rounded-lg text-sm ${
                slot.isAvailable
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {slot.startTime} - {slot.endTime}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
