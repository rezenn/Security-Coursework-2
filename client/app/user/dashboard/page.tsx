"use client";

import Link from "next/link";
import RecentViewCard from "../_component/RecentViewCard";
import OrganizationsDetailsCard from "../_component/OrganizationDetailCard";
import OrganizationFilter from "../_component/OrganizationFilter";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/authContext";

export default function Dashboard() {
  const [activeFilter, setActiveFilter] = useState("All");

  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) return null;
  return (
    <div>
      {" "}
      <h2 className=" px-2 text-lg font-semibold ">Recently Viewed</h2>
      <div className="h-full space-y-4">
        <div className="flex flex-row overflow-x-auto pb-1">
          <RecentViewCard />
        </div>
        <div className=" border-b border-gray-400"></div>
        <OrganizationFilter
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
        <div className="flex flow-col overflow-y-auto pb-5">
          <OrganizationsDetailsCard activeFilter={activeFilter} />
        </div>
      </div>
    </div>
  );
}
