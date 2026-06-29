"use client";
/**
 * Google OAuth success landing page.
 * Server redirects here with ?token=ACCESS_TOKEN&role=user|admin
 * Stores the token once, refreshes user context, redirects to dashboard.
 */
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";
import Cookies from "js-cookie";
import { PageLoader } from "@/components/shared";

export default function GoogleSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    const role = searchParams.get("role");
    const error = searchParams.get("error");

    if (error || !token) {
      router.replace("/login?error=google_failed");
      return;
    }

    // Store access token (same as regular login)
    Cookies.set("access_token", token, {
      expires: 1 / 96, // 15 minutes
      sameSite: "strict",
    });

    // Refresh context then redirect
    refreshUser().then(() => {
      router.replace(role === "admin" ? "/admin" : "/dashboard");
    });
  }, []);

  return <PageLoader />;
}
