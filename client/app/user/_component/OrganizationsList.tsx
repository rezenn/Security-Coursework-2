"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/authContext";
import { getAuthToken } from "@/lib/auth-utils";
import { toast } from "sonner";
import Image from "next/image";
import building from "@/app/assets/images/buildingPlaceholder.jpg";

interface Organization {
  _id: string;
  organizationName: string;
  user: {
    _id: string;
    fullName: string;
    profilePicture?: string;
  };
}

export default function OrganizationsList() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const token = await getAuthToken();

        const res = await fetch("http://localhost:5050/api/organizations", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (data.success) {
          setOrganizations(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch organizations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  const sendDirectMessage = async (orgUserId: string, orgName: string) => {
    if (!user) return;

    setSending(orgUserId);

    try {
      const token = await getAuthToken();

      const response = await fetch(
        "http://localhost:5050/api/message/send-to-org",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orgUserId,
            message: `Hello ${orgName}! I'd like to get in touch.`,
          }),
        },
      );

      const result = await response.json();

      if (result.success) {
        toast.success(
          `Message sent to ${orgName}!\nCheck Direct Messages tab.`,
        );
      } else {
        toast.error(`Failed: ${result.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Send message error:", error);
      toast.error("Network error. Please check your connection.");
    } finally {
      setSending(null);
    }
  };

  if (loading) {
    return <div className="p-12 text-center">Loading organizations...</div>;
  }

  return (
    <div className="bg-white-50 py-2">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-6">
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Send direct messages to start 1:1 conversations instantly
          </p>
        </div>

        {organizations.length === 0 ? (
          <div className="text-center py-1">
            <p className="text-gray-500 text-xl">No organizations found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {organizations.map((org) => (
              <div
                key={org._id}
                className="group bg-white/80 backdrop-blur-xl  rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-1 p-2 cursor-pointer border border-gray-100"
              >
                <div className="w-full h-40 mb-4 rounded-3xl overflow-hidden shadow-lg mx-auto border border-gray-100">
                  <Image
                    src={
                      org.user.profilePicture
                        ? `http://localhost:5050/uploads/profile/${org.user.profilePicture}`
                        : building.src
                    }
                    alt={org.organizationName}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover"
                  />
                </div>

                <h3 className="text-lg font-black text-gray-900 mb-6 text-center">
                  {org.organizationName}
                </h3>

                <button
                  onClick={() =>
                    sendDirectMessage(org.user._id, org.organizationName)
                  }
                  disabled={sending === org.user._id}
                  className="w-full bg-[#B61BE1] text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:from-gray-400 disabled:to-gray-500 disabled:transform-none disabled:cursor-not-allowed"
                >
                  {sending === org.user._id ? (
                    <>
                      <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>Send First Message</>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
