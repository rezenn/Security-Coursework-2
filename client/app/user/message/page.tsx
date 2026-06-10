"use client";

import { useState, Suspense } from "react";
import { useAuth } from "@/context/authContext";
import ChatInterface from "@/app/user/_component/ChatInterface";
import OrganizationsList from "@/app/user/_component/OrganizationsList";

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

  const handleSwitchToChat = () => {
    setActiveView("chat");
  };

  return (
    <div className=" bg-white-50 py-1">
      <div className="container mx-auto px-2 pt-4 max-w-7xl">
        <div className="flex flex-wrap gap-4 mb-2 justify-center">
          <button
            onClick={() => setActiveView("chat")}
            className={`px-4 py-2 rounded-2xl font-black text-lg shadow-xl transition-all duration-300 ${
              activeView === "chat"
                ? "bg-[#B61BE1] text-white scale-105"
                : "bg-white text-gray-700 hover:bg-gray-50 hover:shadow-xl"
            }`}
          >
            Direct Messages
          </button>
          <button
            onClick={() => setActiveView("orgs")}
            className={`px-4 py-2 rounded-2xl font-black text-lg shadow-xl transition-all duration-300 ${
              activeView === "orgs"
                ? "bg-[#B61BE1] text-white scale-105"
                : "bg-white text-gray-700 hover:bg-gray-50 hover:shadow-xl"
            }`}
          >
            Organizations
          </button>
        </div>

        <div className="min-h-[600px]">
          <Suspense fallback={<LoadingFallback />}>
            {activeView === "chat" ? (
              <ChatInterface
                userId={user._id}
                userName={user.fullName}
                userImage={user.imageUrl}
                key={activeView} // Force remount when switching views
              />
            ) : (
              <OrganizationsList />
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
