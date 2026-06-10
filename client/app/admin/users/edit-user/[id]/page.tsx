"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import EditUserForm from "@/app/admin/_component/UpdateUserForm";
import { handleGetOneUser } from "@/lib/actions/admin/user-action";
import { toast } from "sonner";

export default function AdminEditUserPage() {
  const params = useParams();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = params.id as string;

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    if (!userId) {
      setError("User ID is required");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await handleGetOneUser(userId);

      if (result.success) {
        setUserData(result.data);
      } else {
        setError(result.message || "Failed to fetch user data");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setError("An error occurred while fetching user data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSuccess = () => {
    fetchUserData();
    toast.success("User data updated successfully!");
    setTimeout(() => {
      router.push("/admin/users");
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="p-6">
        <p className="text-gray-500">No user data found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 px-4">
      <div className="pb-5">
        <Link
          className="w-25 bg-[#B61BE1] text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          href="/admin/users"
        >
          <ArrowLeft />
          <p>Back</p>
        </Link>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-linear-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
          Edit User
        </h1>
        <p className="text-gray-600 mt-2">
          Update the information of{" "}
          <span className="capitalize font-medium text-purple-600">
            {userData.fullName}
          </span>
        </p>
      </div>

      <div className="bg-linear-to-br from-white via-white to-purple-50 shadow-2xl rounded-3xl overflow-hidden border border-purple-100">
        <EditUserForm initialUser={userData} onSuccess={handleUpdateSuccess} />

        <footer>
          <div className="px-8 py-6 bg-linear-to-r from-gray-50 to-white border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-600">
                <span className="font-medium">Last updated:</span>{" "}
                {userData?.updatedAt
                  ? new Date(userData.updatedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Never"}
              </div>
              <div className="text-gray-500">
                <span className="font-medium">User ID:</span>{" "}
                <span className="font-mono">{userData?._id}</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
