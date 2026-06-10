"use client";

import { Plus, TrendingUpIcon, Building2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { handleGetAllOrganizations } from "@/lib/actions/organization/organization-action";
import OrganizationTable from "./_components/OrganizationTable";

export default function AdminOrganizationsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [totalOrganizations, setTotalOrganizations] = useState(0);
  const [newOrgsThisMonth, setNewOrgsThisMonth] = useState(0);
  const [newOrgsLastMonth, setNewOrgsLastMonth] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const result = await handleGetAllOrganizations();

      if (result.success && result.data) {
        const orgs: any[] = Array.isArray(result.data) ? result.data : [];
        setTotalOrganizations(orgs.length);

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        setNewOrgsThisMonth(
          orgs.filter((org) => {
            const d = new Date(org.createdAt);
            return (
              d.getFullYear() === currentYear && d.getMonth() === currentMonth
            );
          }).length,
        );

        const lastMonthDate = new Date();
        lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
        setNewOrgsLastMonth(
          orgs.filter((org) => {
            const d = new Date(org.createdAt);
            return (
              d.getFullYear() === lastMonthDate.getFullYear() &&
              d.getMonth() === lastMonthDate.getMonth()
            );
          }).length,
        );
      }
    } catch (error) {
      console.error("Error fetching organization stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const growthRate =
    newOrgsLastMonth > 0
      ? Math.round(
          ((newOrgsThisMonth - newOrgsLastMonth) / newOrgsLastMonth) * 100,
        )
      : newOrgsThisMonth > 0
        ? 100
        : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Organizations Management
          </h1>
          <p className="text-gray-600">Manage all registered organizations</p>
        </div>
        <button
          className="px-4 py-2 rounded-lg flex items-center gap-2 bg-fuchsia-200/50 hover:bg-fuchsia-200 text-gray-900 font-medium transition-colors duration-200 shadow-sm hover:shadow border border-fuchsia-400/40"
          onClick={() =>
            router.push("/admin/organizations/create-organization")
          }
        >
          <Plus size={18} />
          Add new organization
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-linear-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">
                Total Organizations
              </p>
              <p className="text-3xl font-bold text-blue-900 mt-2">
                {isLoading ? "..." : totalOrganizations}
              </p>
            </div>
            <div className="bg-blue-600 p-3 rounded-full">
              <Building2 className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-linear-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">
                New This Month
              </p>
              <p className="text-3xl font-bold text-purple-900 mt-2">
                {isLoading ? "..." : newOrgsThisMonth}
              </p>
            </div>
            <div className="bg-purple-600 p-3 rounded-full">
              <Building2 className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-linear-to-br from-fuchsia-50 to-fuchsia-100 border border-fuchsia-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-fuchsia-700">
                New Last Month
              </p>
              <p className="text-3xl font-bold text-fuchsia-900 mt-2">
                {isLoading ? "..." : newOrgsLastMonth}
              </p>
            </div>
            <div className="bg-fuchsia-600 p-3 rounded-full">
              <Building2 className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div
          className={`${
            growthRate >= 0
              ? "bg-linear-to-br from-green-50 to-green-100 border-green-200"
              : "bg-linear-to-br from-red-50 to-red-100 border-red-200"
          } border rounded-xl p-6`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Growth Rate</p>
              <p
                className={`text-2xl font-bold ${
                  growthRate >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {isLoading ? "..." : `${growthRate}%`}
              </p>
            </div>
            <div className="bg-teal-600 p-3 rounded-full">
              <TrendingUpIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <OrganizationTable />
    </div>
  );
}
