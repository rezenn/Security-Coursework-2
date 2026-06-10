"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import EditOrganizationForm from "../_components/EditOrganizationForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  handleGetMyOrganizationDetails,
  handleUpdateOrganizationDetails,
} from "@/lib/actions/organization/organization-action";
import { OrganizationData } from "@/types/organization.types";
import { toast } from "sonner";

export default function Page() {
  const [data, setData] = useState<OrganizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    fetchOrganizationData();
  }, []);

  const fetchOrganizationData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await handleGetMyOrganizationDetails();
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.message || "Failed to fetch organization data");
      }
    } catch (err) {
      setError("Failed to load organization data");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updateData: any) => {
    try {
      setLoading(true);
      const result = await handleUpdateOrganizationDetails(updateData);

      if (result.success) {
        toast.success("Organization details updated successfully!");
        router.push("/organization/details");
      } else {
        toast.error(result.message || "Failed to update organization");
      }
    } catch (err) {
      toast.error("Update failed. Please try again.");
      setError("Update failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  const handleCancel = () => {
    router.push("/organization/details");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading organization details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/organization/details"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            Go Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ padding: "20px 20px 0 20px" }}>
        <Link
          href="/organization/details"
          className="w-25 bg-[#B61BE1] text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </Link>
      </div>

      {/* Edit Form */}
      <EditOrganizationForm
        initialData={data}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}
