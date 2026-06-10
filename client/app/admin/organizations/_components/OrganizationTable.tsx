"use client";

import {
  Search,
  Mail,
  Phone,
  Calendar,
  Edit,
  Trash2,
  Building2,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import DeleteModal from "@/app/_components/DeleteModal";
import { handleGetAllOrganizations } from "@/lib/actions/organization/organization-action";
import {
  handleGetAllUsers,
  handleDeleteUser,
} from "@/lib/actions/admin/user-action";

export default function OrganizationTable() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [allOrgs, setAllOrgs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrganizations, setTotalOrganizations] = useState(0);
  const ORGS_PER_PAGE = 10;

  const router = useRouter();

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    applyFilterAndPaginate(allOrgs, searchQuery, currentPage);
  }, [searchQuery, currentPage, allOrgs]);

  const fetchOrganizations = async () => {
    try {
      setIsLoading(true);

      // Fetch both: org details (OrganizationModel) + all org-role users (UserModel)
      const [orgDetailsResult, orgUsersResult] = await Promise.all([
        handleGetAllOrganizations(),
        handleGetAllUsers(1, 1000, "", "organization"),
      ]);

      // Orgs that have filled in their details (from OrganizationModel)
      const orgsWithDetails: any[] =
        orgDetailsResult.success && Array.isArray(orgDetailsResult.data)
          ? orgDetailsResult.data
          : [];

      // All users with role=organization (from UserModel)
      const orgUsers: any[] =
        orgUsersResult.success && Array.isArray(orgUsersResult.users)
          ? orgUsersResult.users
          : [];

      // Build a Set of userIds that already have org details
      const userIdsWithDetails = new Set(
        orgsWithDetails
          .map((org) => org.userId?.toString() || org.user?._id?.toString())
          .filter(Boolean),
      );

      // Org users that have NOT filled in details yet — show them as bare rows
      const orgsWithoutDetails = orgUsers
        .filter((u) => !userIdsWithDetails.has(u._id?.toString()))
        .map((u) => ({
          _id: u._id,
          // No organizationName yet — use fullName as fallback
          organizationName: null,
          contactEmail: null,
          contactPhone: null,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
          hasDetails: false,
          // Embed user info directly
          user: {
            _id: u._id,
            fullName: u.fullName,
            email: u.email,
            phoneNumber: u.phoneNumber,
            profilePicture: u.profilePicture,
            imageUrl: u.imageUrl,
          },
        }));

      // Orgs with details — mark them
      const orgsWithDetailsMarked = orgsWithDetails.map((org) => ({
        ...org,
        hasDetails: true,
      }));

      // Merge: detailed orgs first, then bare users
      const merged = [...orgsWithDetailsMarked, ...orgsWithoutDetails];

      setAllOrgs(merged);
      applyFilterAndPaginate(merged, searchQuery, 1);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      toast.error("Failed to fetch organizations");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilterAndPaginate = (orgs: any[], query: string, page: number) => {
    let filtered = orgs;
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = orgs.filter(
        (org) =>
          org.organizationName?.toLowerCase().includes(q) ||
          org.contactEmail?.toLowerCase().includes(q) ||
          org.contactPhone?.includes(q) ||
          org.user?.fullName?.toLowerCase().includes(q) ||
          org.user?.email?.toLowerCase().includes(q) ||
          org.user?.phoneNumber?.includes(q),
      );
    }
    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / ORGS_PER_PAGE));
    const safePage = Math.min(page, pages);
    const start = (safePage - 1) * ORGS_PER_PAGE;
    setTotalOrganizations(total);
    setTotalPages(pages);
    setCurrentPage(safePage);
    setOrganizations(filtered.slice(start, start + ORGS_PER_PAGE));
  };

  const handleConfirmDelete = async (orgId: string) => {
    try {
      // Deletes the user account (and org details cascade if you set that up)
      const result = await handleDeleteUser(orgId);
      if (result.success) {
        toast.success("Organization deleted successfully");
        fetchOrganizations();
      } else {
        toast.error(result.message || "Failed to delete organization");
      }
    } catch {
      toast.error("Failed to delete organization");
    } finally {
      setDeleteId(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "yyyy-MM-dd");
    } catch {
      return "Invalid Date";
    }
  };

  const getLogoUrl = (org: any): string | null => {
    try {
      if (org.user?.imageUrl) return org.user.imageUrl;
      if (org.user?.profilePicture) {
        const base =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050";
        return `${base}/uploads/profile/${org.user.profilePicture}`;
      }
      return null;
    } catch {
      return null;
    }
  };

  return (
    <div>
      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleConfirmDelete(deleteId)}
        title="Confirm Delete Organization"
        description="Are you sure you want to delete this organization? This action cannot be undone."
      />

      <div className="space-y-6 p-6">
        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="relative">
            <input
              type="search"
              placeholder="Search by name, email, phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 sm:h-12 rounded-xl border border-black/20 bg-white px-3 sm:px-4 pr-10 text-sm sm:text-base text-black placeholder:text-black/40 focus:outline-none focus:border-purple-600 focus:ring-2 transition"
            />
            <Search
              size={18}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-black/50"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-200 border-b border-gray-200">
                    <tr>
                      {[
                        "Organization",
                        "Email",
                        "Phone",
                        "Status",
                        "Registered Date",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {organizations.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-9 py-8 text-center text-gray-500"
                        >
                          No organizations found
                        </td>
                      </tr>
                    ) : (
                      organizations.map((org) => {
                        const logoUrl = getLogoUrl(org);
                        return (
                          <tr
                            key={org._id}
                            className="hover:bg-gray-100 transition-colors"
                          >
                            {/* Organization name */}
                            <td className="px-6 py-4 align-middle">
                              <div className="flex items-center gap-3">
                                <div className="h-12 w-12 shrink-0 relative rounded-full overflow-hidden">
                                  <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-fuchsia-100 to-purple-100 rounded-full border-2 border-fuchsia-400">
                                    <Building2
                                      className="text-fuchsia-400"
                                      size={22}
                                    />
                                  </div>
                                  {logoUrl && (
                                    <Image
                                      src={logoUrl}
                                      alt={org.organizationName || "Logo"}
                                      fill
                                      className="object-cover rounded-full"
                                      unoptimized
                                      sizes="48px"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                      }}
                                    />
                                  )}
                                </div>
                                <div>
                                  <div
                                    className="text-sm font-semibold text-gray-900"
                                    style={{ textTransform: "capitalize" }}
                                  >
                                    {org.user?.fullName || (
                                      <span className="text-gray-400 italic">
                                        Not set
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    ID: {org._id?.substring(0, 12)}...
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Email */}
                            <td className="px-6 py-4 align-middle whitespace-nowrap">
                              <div className="flex items-center text-sm">
                                <Mail className="h-4 w-4 mr-2 text-gray-400 shrink-0" />
                                <span className="text-gray-900 truncate max-w-[160px]">
                                  {org.contactEmail || org.user?.email || "N/A"}
                                </span>
                              </div>
                            </td>

                            {/* Phone */}
                            <td className="px-6 py-4 align-middle whitespace-nowrap">
                              <div className="flex items-center text-sm">
                                <Phone className="h-4 w-4 mr-2 text-gray-400 shrink-0" />
                                <span className="text-gray-900 truncate max-w-[130px]">
                                  {org.user?.phoneNumber || "N/A"}
                                </span>
                              </div>
                            </td>

                            {/* Status badge */}
                            <td className="px-6 py-4 align-middle whitespace-nowrap">
                              {org.hasDetails ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Profile complete
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Pending setup
                                </span>
                              )}
                            </td>

                            {/* Created */}
                            <td className="px-6 py-4 align-middle whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-900">
                                <Calendar className="h-4 w-4 mr-2 text-gray-400 shrink-0" />
                                {formatDate(org.createdAt)}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 align-middle whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <button
                                  className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit organization"
                                  onClick={() =>
                                    router.push(
                                      `/admin/organizations/edit-organization/${org.user?._id || org._id}`,
                                    )
                                  }
                                >
                                  <Edit size={18} />
                                </button>
                                <button
                                  className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete organization"
                                  onClick={() =>
                                    setDeleteId(org.user?._id || org._id)
                                  }
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalOrganizations > 0 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">
                        {(currentPage - 1) * ORGS_PER_PAGE + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(
                          currentPage * ORGS_PER_PAGE,
                          totalOrganizations,
                        )}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium">{totalOrganizations}</span>{" "}
                      organizations
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-2 text-sm font-medium text-gray-900">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
