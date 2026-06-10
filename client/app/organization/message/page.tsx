"use client";

import { useState, Suspense } from "react";
import { useAuth } from "@/context/authContext";
import OrganizationChat from "@/app/organization/_component/OrganizationChat";

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-[600px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
}

export default function ChatPage() {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState<"chat" | "orgs">("chat");

  if (loading) return <LoadingFallback />;
  if (!user) return <div className="p-8 text-center">Please log in</div>;

  const isOrganization = user.role === "organization";

  return (
    <div className="container mx-auto px-1 py-2 max-w-7xl">
      <div className="min-h-[600px]">
        <Suspense fallback={<LoadingFallback />}>
          <OrganizationChat
            userId={user._id}
            userName={user.fullName}
            userImage={user.imageUrl}
          />
        </Suspense>
      </div>
    </div>
  );
}
