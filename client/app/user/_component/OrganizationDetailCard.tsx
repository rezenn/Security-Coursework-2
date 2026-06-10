"use client";

import Image from "next/image";
import { MapPinIcon } from "@heroicons/react/24/solid";
import { ClockIcon } from "@heroicons/react/24/outline";
import { useState, useEffect, useMemo } from "react";
import { handleGetAllOrganizations } from "@/lib/actions/organization/organization-action";
import Link from "next/link";
import { OrganizationData } from "@/types/organization.types";
import building from "@/app/assets/images/buildingPlaceholder.jpg";
import { usePathname, useRouter } from "next/navigation";
import { addRecentlyViewed } from "@/lib/utils/recentlyViewed";

interface OrganizationsDetailsCardProps {
  activeFilter?: string;
}

export default function OrganizationsDetailsCard({
  activeFilter = "All",
}: OrganizationsDetailsCardProps) {
  const [organizations, setOrganizations] = useState<OrganizationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const result = await handleGetAllOrganizations();
      if (result.success && result.data) {
        setOrganizations(result.data);
        
      } else {
        setError(result.message || "Failed to fetch organizations");
      }
    } catch {
      setError("An error occurred while fetching data");
    } finally {
      setLoading(false);
    }
  };

  const filteredOrganizations = useMemo(() => {
    if (!activeFilter || activeFilter === "All") return organizations;
    const needle = activeFilter.toLowerCase().trim();
    return organizations.filter(
      (org) => (org.organizationType ?? "").toLowerCase().trim() === needle,
    );
  }, [organizations, activeFilter]);

  const getProfileImageUrl = (
    organization: OrganizationData,
  ): string | null => {
    if (imageErrors[organization._id]) return null;
    const profilePicture = organization.user?.profilePicture;
    if (!profilePicture) return null;
    if (profilePicture.startsWith("http")) return profilePicture;
    return `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/profile/${profilePicture}`;
  };

  const handleImageError = (organizationId: string) => {
    setImageErrors((prev) => ({ ...prev, [organizationId]: true }));
  };

  const getWorkingHoursDisplay = (workingHours: any[]) => {
    if (!workingHours || workingHours.length === 0)
      return "Hours not available";
    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const todayDay = days[new Date().getDay()];
    const todayHours = workingHours.find((h) => h.day === todayDay);
    if (todayHours?.isWorking)
      return `${todayHours.openingTime} - ${todayHours.closingTime}`;
    return "Closed Today";
  };

  const handleCardClick = (
    e: React.MouseEvent,
    organization: OrganizationData,
  ) => {
    e.preventDefault(); 
    addRecentlyViewed({
      _id: organization._id,
      organizationName: organization.organizationName,
      organizationType: organization.organizationType,
      street: organization.street,
      city: organization.city,
      profilePicture: organization.user?.profilePicture,
    });
    router.push(
      `/user/organization/${organization._id}?returnTo=${encodeURIComponent(pathname)}`,
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 w-full gap-6 px-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-black/5 p-2 shadow animate-pulse"
          >
            <div className="w-full h-40 bg-gray-200 rounded-xl mb-2" />
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-1/2 mb-1" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full text-center py-10">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchOrganizations}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (filteredOrganizations.length === 0) {
    return (
      <div className="w-full text-center py-16">
        <p className="text-gray-500 text-lg font-medium">
          {activeFilter === "All"
            ? "No organizations found"
            : `No "${activeFilter}" organizations found`}
        </p>
        <p className="text-gray-400 text-sm mt-1">
          {activeFilter !== "All" && "Try selecting a different category"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 w-full gap-6 px-2">
      {filteredOrganizations.map((organization) => {
        const profileImageUrl = getProfileImageUrl(organization);

        return (
          <Link
            key={organization._id}
            href={`/user/organization/${organization._id}?returnTo=${encodeURIComponent(pathname)}`}
            onClick={(e) => handleCardClick(e, organization)}
            className="w-full bg-white border border-black/5 rounded-xl p-2 shadow-lg flex flex-col items-center hover:shadow-xl transition-shadow"
          >
            <div className="w-full h-40 relative rounded-xl overflow-hidden border">
              {profileImageUrl ? (
                <Image
                  src={profileImageUrl}
                  alt={organization.organizationName}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  style={{ objectFit: "cover" }}
                  onError={() => handleImageError(organization._id)}
                  unoptimized
                />
              ) : (
                <Image
                  src={building}
                  alt={organization.organizationName}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  style={{ objectFit: "cover" }}
                />
              )}
            </div>
            <div className="w-full mt-2 text-sm space-y-1">
              <h1 className="font-semibold text-lg my-1 line-clamp-1">
                {organization.organizationName}
              </h1>
              {organization.organizationType && (
                <span className="inline-block text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium capitalize">
                  {organization.organizationType}
                </span>
              )}
              <div className="flex flex-row gap-1">
                <MapPinIcon className="w-4 text-red-600 shrink-0 mt-0.5" />
                <p className="line-clamp-1 text-gray-600">
                  {organization.street}, {organization.city}
                </p>
              </div>
              <div className="flex flex-row gap-1">
                <ClockIcon className="w-4 text-gray-500 shrink-0 mt-0.5" />
                <p className="line-clamp-1 text-gray-600">
                  {getWorkingHoursDisplay(organization.workingHours)}
                </p>
              </div>
              <div className="h-px w-full bg-gray-200 my-1" />
              <p className="line-clamp-2 text-gray-500 text-xs">
                {organization.description || "No description available"}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
