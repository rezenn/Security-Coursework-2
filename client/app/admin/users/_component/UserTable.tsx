"use client";

import {
  Search,
  Mail,
  Phone,
  Calendar,
  Edit,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/context/authContext";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { getAllUsers } from "@/lib/api/admin/user";
import { toast } from "sonner";
import DeleteModal from "@/app/_components/DeleteModal";
import { handleDeleteUser } from "@/lib/actions/admin/user-action";

export default function UserTable() {
  const { user, loading } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [newUsersThisMonth, setNewUsersThisMonth] = useState(0);
  const [newUsersLastMonth, setNewUsersLastMonth] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [pagination, setPagination] = useState<any>(null);
  const USERS_PER_PAGE = 10;

  const router = useRouter();

  useEffect(() => {
    fetchUsers(1);
  }, []);

  const fetchUsers = async (page = 1) => {
    try {
      setIsLoading(true);
      const result = await getAllUsers(
        page,
        USERS_PER_PAGE,
        searchQuery,
        "user",
      );

      if (result.success && result.data) {
        setUsers(result.data.users || []);

        if (result.data.pagination) {
          setPagination(result.data.pagination);
          setCurrentPage(result.data.pagination.page);
          setTotalPages(result.data.pagination.totalPages);
          setTotalUsers(result.data.pagination.total);
        }
      } else {
        setUsers([]);
        setTotalPages(1);
        setTotalUsers(0);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers(1);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleConfirmDelete = async (userId: string) => {
    try {
      const result = await handleDeleteUser(userId);
      if (result.success) {
        toast.success("User deleted successfully");
        fetchUsers(currentPage);
        setDeleteId(null);
      } else {
        toast.error(result.message || "Failed to delete user");
      }
    } catch (err) {
      toast.error("Failed to delete user");
    } finally {
      setDeleteId(null);
    }
  };

  // format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "yyyy-MM-dd");
    } catch (error) {
      return "Invalid Date";
    }
  };

  const getProfileImageUrl = (user: any) => {
    try {
      if (user.imageUrl && user.imageUrl.startsWith("http")) {
        return user.imageUrl;
      }

      if (user.profilePicture) {
        const baseUrl =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5050";
        const url = `${baseUrl}/uploads/profile/${user.profilePicture}`;
        return url;
      }

      return null;
    } catch (error) {
      console.error("Image URL error:", error);
      return null;
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchUsers(page);
    }
  };

  return (
    <div>
      <DeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleConfirmDelete(deleteId)}
        title="Confirm Delete User"
        description="Are you sure you want to delete this user? Once deleted user cannot be retrieved."
      />
      <div className="space-y-6 p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-5">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search user"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 sm:h-12 rounded-xl border border-black/20 bg-white px-3 sm:px-4 pr-10 text-sm sm:text-base text-black placeholder:text-black/40 focus:outline-none focus:border-black-600 focus:ring-2 transition"
                />
                <button
                  type="button"
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-black/50 hover:text-purple-700 transition"
                >
                  <Search size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  {/* Table head */}
                  <thead className="bg-gray-200 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">
                        Registered Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">
                        Last Updated Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  {/* user details */}
                  <tbody className="divide-y divide-gray-200">
                    {users.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-9 py-8 text-center text-gray-500"
                        >
                          No users found
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr
                          key={user._id}
                          className="hover:bg-gray-100 transition-colors"
                        >
                          <td className="px-6 py-4 align-middle">
                            <div className="flex items-center gap-2">
                              <div className="h-12 w-12 shrink-0 relative rounded-full overflow-hidden">
                                <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-purple-100 to-pink-100 rounded-full border-2 border-fuchsia-400">
                                  <UserIcon
                                    className="text-purple-400"
                                    size={28}
                                  />
                                </div>
                                {getProfileImageUrl(user) && (
                                  <Image
                                    src={getProfileImageUrl(user)!}
                                    alt={user.fullName || "User profile"}
                                    fill
                                    className="object-cover rounded-full"
                                    unoptimized
                                    sizes="64px"
                                    onError={(e) => {
                                      console.error(
                                        `404: ${getProfileImageUrl(user)}`,
                                      );
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                )}
                              </div>
                              <div className="gap-1">
                                <div
                                  className="text-sm font-semibold text-gray-900"
                                  style={{ textTransform: "capitalize" }}
                                >
                                  {user.fullName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  ID: {user._id.substring(0, 12)}...
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 align-middle whitespace-nowrap">
                            <div className="flex items-center text-sm">
                              <Mail className="h-4 w-4 mr-2 text-gray-400 shrink-0" />
                              <span className="text-gray-900 truncate w-35">
                                {user.email}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4 align-middle whitespace-nowrap">
                            <div className="flex items-center text-sm">
                              <Phone className="h-4 w-4 mr-2 text-gray-400 shrink-0" />
                              <span className="text-gray-900 truncate w-40">
                                {user.phoneNumber || "N/A"}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4 align-middle whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              <Calendar className="h-4 w-4 mr-2 text-gray-400 shrink-0" />
                              {formatDate(user.createdAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4 align-middle whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              <Calendar className="h-4 w-4 mr-2 text-gray-400 shrink-0" />
                              {formatDate(user.updatedAt)}
                            </div>
                          </td>

                          <td className="px-6 py-4 align-middle whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <button
                                className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit user"
                                onClick={() =>
                                  router.push(
                                    `/admin/users/edit-user/${user._id}`,
                                  )
                                }
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete user"
                                onClick={() => setDeleteId(user._id)}
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination - Using backend data */}
              {totalUsers > 0 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">
                        {(currentPage - 1) * USERS_PER_PAGE + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(currentPage * USERS_PER_PAGE, totalUsers)}
                      </span>{" "}
                      of <span className="font-medium">{totalUsers}</span> users
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-2 text-sm font-medium text-gray-900">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
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
