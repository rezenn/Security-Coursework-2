"use client";
import { useState } from "react";
import { X, LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/context/authContext";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LogoutModal({ isOpen, onClose }: LogoutModalProps) {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      // The logout function already handles redirect
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <LogOut size={20} className="text-red-400" />
            Sign Out
          </h2>
          {!isLoggingOut && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-slate-300 text-sm">
              Are you sure you want to sign out? You will need to log in again
              to access your courses and account.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-medium py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Signing out...
                </>
              ) : (
                <>
                  <LogOut size={18} />
                  Sign Out
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={isLoggingOut}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-2.5 px-4 rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
