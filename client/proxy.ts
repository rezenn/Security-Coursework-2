import { NextRequest, NextResponse } from "next/server";
import { getAuthToken, getUserData } from "./lib/cookie";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const staticAssets = [
    "/favicon.ico",
    "/icon",
    "/apple-icon",
    "/images/",
    "/uploads/",
  ];
  if (staticAssets.some((asset) => pathname.startsWith(asset))) {
    return NextResponse.next();
  }

  const token = await getAuthToken();
  const user = token ? await getUserData() : null;

  //public routes
  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forget-password") ||
    pathname.startsWith("/reset-password") ||
    pathname === "/";

  // Block unauthenticated access to all protected routes
  if (
    !token &&
    (pathname.startsWith("/user") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/organization"))
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Prevent logged-in users from visiting auth pages
  if (token && isPublic) {
    // Redirect to appropriate dashboard based on role
    switch (user?.role) {
      case "admin":
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      case "organization":
        return NextResponse.redirect(
          new URL("/organization/dashboard", request.url),
        );
      case "user":
      default:
        return NextResponse.redirect(new URL("/user/dashboard", request.url));
    }
  }

  // Role-based route protection
  if (token && user) {
    const userRole = user.role;

    // Validate user has a valid role
    if (!["admin", "organization", "user"].includes(userRole)) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("auth_token");
      response.cookies.delete("user_data");
      return response;
    }

    // Admin can only access /admin/* routes
    if (userRole === "admin") {
      if (!pathname.startsWith("/admin")) {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
    }

    // Organization can only access /organization/* routes
    else if (userRole === "organization") {
      if (!pathname.startsWith("/organization")) {
        return NextResponse.redirect(
          new URL("/organization/dashboard", request.url),
        );
      }
    }

    // User can only access /user/* routes
    else if (userRole === "user") {
      if (!pathname.startsWith("/user")) {
        return NextResponse.redirect(new URL("/user/dashboard", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/user/:path*",
    "/organization/:path*",
    "/login",
    "/register",
    "/forget-password",
    "/reset-password",
    "/",
  ],
};
