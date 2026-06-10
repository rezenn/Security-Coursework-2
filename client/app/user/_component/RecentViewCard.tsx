"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getRecentlyViewed, RecentOrg } from "@/lib/utils/recentlyViewed";
import building from "@/app/assets/images/buildingPlaceholder.jpg";
import { usePathname } from "next/navigation";

export default function RecentlyViewed() {
  const [recents, setRecents] = useState<RecentOrg[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    const load = () => setRecents(getRecentlyViewed());
    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  if (recents.length === 0) return null;

  return (
    <div>
      <div className="flex flex-row gap-3 overflow-x-auto pb-2 px-2">
        {recents.map((org) => {
          const imgSrc = org.profilePicture
            ? org.profilePicture.startsWith("http")
              ? org.profilePicture
              : `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/profile/${org.profilePicture}`
            : null;

          return (
            <Link
              key={org._id}
              href={`/user/organization/${org._id}?returnTo=${encodeURIComponent(pathname)}`}
              className="shrink-0 w-46 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-white p-1.5"
            >
              <div className="w-full h-24 relative rounded-lg overflow-hidden mb-1.5">
                <Image
                  src={imgSrc || building}
                  alt={org.organizationName}
                  fill
                  style={{ objectFit: "cover" }}
                  unoptimized={!!imgSrc}
                />
              </div>
              <p className="text-xs font-semibold line-clamp-1 text-gray-800">
                {org.organizationName}
              </p>
              {org.organizationType && (
                <p className="text-xs text-purple-600 capitalize line-clamp-1">
                  {org.organizationType}
                </p>
              )}
              {org.city && (
                <p className="text-xs text-gray-400 line-clamp-1">{org.city}</p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
