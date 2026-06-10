"use client";

import { useAuth } from "@/context/authContext";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { User, Calendar, Edit3, Shield, Award } from "lucide-react";
import { format } from "date-fns";

export default function ViewProfile() {
  const { user, loading } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [hover, setHover] = useState(false);

  const getRoleBasedRoute = (baseRoute: string, role?: string) => {
    if (!role) return `/user${baseRoute}`;
    switch (role.toLocaleLowerCase()) {
      case "admin":
        return `/admin${baseRoute}`;
      case "organization":
        return `/organization${baseRoute}`;
      case "user":
      default:
        return `/user${baseRoute}`;
    }
  };

  useEffect(() => {
    setImageError(false);
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-10">
        <div className="bg-white shadow-2xl rounded-3xl p-8 border border-gray-100 animate-pulse">
          <div className="flex flex-col items-center">
            <div className="w-40 h-40 bg-gray-200 rounded-full mb-6"></div>
            <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      </div>
    );
  }

  const getProfileImageUrl = () => {
    if (!user) return null;
    if (user.imageUrl) return user.imageUrl;
    if (user.profilePicture) {
      return `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api", "")}/uploads/profile/${user.profilePicture}`;
    }
    return null;
  };

  const profileImageUrl = getProfileImageUrl();

  const formattedDate = user?.createdAt
    ? format(new Date(user.createdAt), "MMM dd, yyyy")
    : "Not available";

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "organization":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-purple-100 text-purple-800 border-purple-200";
    }
  };

  return (
    <div className="max-w-8xl mx-auto my-5 ">
      <div className="bg-linear-to-br from-white to-gray-50 shadow-2xl rounded-3xl overflow-hidden border border-gray-100">
        <div className="relative h-48 bg-[linear-gradient(to_left,#BDDCFF_0%,#BCC2FB_13%,#BA7BF0_50%,#B846E8_78%,#B61BE1_100%)]">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute bottom-0 left-8 transform translate-y-1/2">
            <Link
              href={getRoleBasedRoute("/profile/update-profile", user?.role)}
            >
              <div
                className="relative group"
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
              >
                <div className="relative h-40 w-40 rounded-full border-4 border-fuchsia-400 shadow-2xl overflow-hidden bg-linear-to-br from-purple-100 to-pink-100">
                  {profileImageUrl && !imageError ? (
                    <Image
                      src={profileImageUrl}
                      alt="Profile"
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      unoptimized
                      onError={() => setImageError(true)}
                      sizes="160px"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="text-purple-400" size={64} />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Edit3 className="text-white" size={24} />
                    <p className="text-white p-2">Edit profile</p>
                  </div>
                </div>
                {/* Decorative rings */}
                <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping"></div>
                <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-pulse"></div>
              </div>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="pt-20 pb-8 px-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <h1
                  className="text-3xl font-bold text-gray-900 "
                  style={{ textTransform: "capitalize" }}
                >
                  {user?.fullName || "User"}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold border ${getRoleColor(user?.role)}`}
                >
                  {user?.role || "User"}
                </span>
              </div>

              <p className="text-gray-600 mb-8 max-w-2xl">
                Welcome to your profile dashboard. Manage your account settings
                and view your activity here.
              </p>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Contact Information
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Email Address</p>
                      <p className="font-medium text-gray-900">
                        {user?.email || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Phone Number</p>
                      <p className="font-medium text-gray-900">
                        {user?.phoneNumber || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Account Type</p>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getRoleColor(user?.role)}`}
                        >
                          {user?.role || "Standard User"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-4">
                Account Details
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                <div className="p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-xl">
                      <Award className="text-purple-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Created On</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formattedDate}
                      </p>
                    </div>
                  </div>
                </div>

                <div className=" p-4 rounded-2xl ">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <Shield className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Account Status</p>
                      <p className="text-lg font-bold text-green-600">Active</p>
                    </div>
                  </div>
                </div>

                <div className=" p-4 rounded-2xl ">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-100 rounded-xl">
                      <Calendar className="text-pink-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Last Updated</p>
                      <p className="text-lg font-bold text-gray-900">
                        {user?.updatedAt
                          ? format(new Date(user.updatedAt), "MMM dd, yyyy")
                          : "Today"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:w-80 mt-8 md:mt-0 md:ml-8">
              <div className="bg-linear-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl">
                <h3 className="text-xl font-bold mb-2">Profile Actions</h3>
                <p className="text-gray-300 text-sm mb-6">
                  Edit your account details{" "}
                </p>

                <div className="space-y-4">
                  <Link
                    href={getRoleBasedRoute(
                      "/profile/update-profile",
                      user?.role,
                    )}
                  >
                    <button className="w-full bg-[#B61BE1] text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg">
                      <Edit3 size={18} />
                      Edit Profile
                    </button>
                  </Link>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-gray-400 text-xs text-center">
                    Last updated:{" "}
                    {user?.updatedAt
                      ? format(new Date(user.updatedAt), "PPpp")
                      : "Recently"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-linear-to-r from-gray-50 to-white border-t border-gray-100 rounded-b-3xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 text-sm">
              User ID:{" "}
              <span className="font-mono text-gray-800">{user?._id}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
