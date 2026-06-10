"use client";

import Image from "next/image";
import { Search, BellDot, User } from "lucide-react";
import { useAuth } from "@/context/authContext";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Header() {
  const { user, loading } = useAuth();
  const [imageError, setImageError] = useState(false);

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

  if (loading) return null;
  const getProfileImageUrl = () => {
    if (!user) return null;

    // Check imageUrl first
    if (user.imageUrl) {
      return user.imageUrl;
    }

    if (user.profilePicture) {
      return `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api", "")}/uploads/profile/${user.profilePicture}`;
    }

    return null;
  };

  const profileImageUrl = getProfileImageUrl();

  return (
    <section className="ml-15 md:ml-0 transition-margin duration-300">
      <div className="px-3 sm:px-4 py-3 sm:py-4">
        <header className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left Section - Greeting and Name */}
          <div className="flex items-center gap-2 min-w-0 shrink">
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-fuchsia-700 text-md sm:text-sm md:text-lg whitespace-nowrap">
                Hello,
              </span>
              <div className="flex items-center gap-1 min-w-0">
                <span
                  className="font-extrabold text-lg sm:text-base md:text-2xl truncate min-w-0 max-w-50"
                  style={{ textTransform: "capitalize" }}
                  title={user?.fullName}
                >
                  {user?.fullName || "User"}
                </span>
              </div>
            </div>
          </div>

          {/* Middle Section - Search */}
          <div className="flex-1 min-w-0 max-w-50 sm:max-w-75 md:max-w-md lg:max-w-2xl mx-2">
            <div className="relative">
              <input
                type="search"
                placeholder="Search..."
                className="w-full h-10 sm:h-12 rounded-xl border border-black/20 bg-white px-3 sm:px-4 pr-10 text-sm sm:text-base text-black placeholder:text-black/40 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 transition"
              />
              <button
                type="button"
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-black/50 hover:text-purple-700 transition"
              >
                <Search size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Right Section - Icons */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* <button className="text-gray-600 hover:text-purple-700 transition p-1">
              <BellDot size={20} className="sm:w-6 sm:h-6" />
            </button> */}

            <div className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-full overflow-hidden border-2 border-fuchsia-400 hover:border-purple-600 transition-colors">
              <Link href={getRoleBasedRoute("/profile", user?.role)}>
                {profileImageUrl && !imageError ? (
                  <Image
                    src={profileImageUrl}
                    alt="Profile"
                    fill
                    className="object-cover"
                    unoptimized
                    onError={() => setImageError(true)}
                    sizes="(max-width: 640px) 36px, 48px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-purple-100 to-pink-100">
                    <User className="text-purple-500" size={18} />
                  </div>
                )}
              </Link>
            </div>
          </div>
        </header>
      </div>
    </section>
  );
}
