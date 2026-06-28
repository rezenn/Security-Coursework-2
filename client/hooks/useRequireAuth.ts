"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserRole } from "@/context/authContext";

export const useRequireAuth = (requiredRole?: UserRole) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (requiredRole && user.role !== requiredRole) {
      router.replace(user.role === "admin" ? "/admin" : "/dashboard");
    }
  }, [user, loading, requiredRole, router]);

  return { user, loading };
};
