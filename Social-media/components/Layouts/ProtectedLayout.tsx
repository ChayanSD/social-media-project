"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGetCurrentUserProfileQuery } from "@/store/authApi";
import type { UserRole } from "@/lib/auth";

type ProtectedLayoutProps = {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  fallbackRedirect?: string;
  unauthenticatedRedirect?: string;
};

/**
 * ProtectedLayout — cookie-based auth guard.
 *
 * Calls /auth/user-profiles/me/ (with cookies) to determine identity.
 * If the request returns 401/error, user is not authenticated → redirect to login.
 * Role checks use the profile.role field from the server response.
 */
export default function ProtectedLayout({
  children,
  allowedRoles,
  fallbackRedirect,
  unauthenticatedRedirect,
}: ProtectedLayoutProps) {
  const router = useRouter();

  const {
    data: profileResponse,
    isLoading,
    isError,
  } = useGetCurrentUserProfileQuery();

  const profile = profileResponse?.data;
  const role = profile?.role || "user";

  useEffect(() => {
    if (isLoading) return;

    // Not authenticated — backend returned 401/error
    if (isError || !profile) {
      router.replace(unauthenticatedRedirect || "/login");
      return;
    }

    // Authenticated but wrong role
    const hasRoleAccess =
      !allowedRoles ||
      allowedRoles.length === 0 ||
      allowedRoles.includes(role);

    if (!hasRoleAccess) {
      router.replace(fallbackRedirect || (role === "admin" ? "/dashboard" : "/"));
    }
  }, [isLoading, isError, profile, role, allowedRoles, fallbackRedirect, unauthenticatedRedirect, router]);

  // Show spinner while the /me call is in flight
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Checking authentication...
      </div>
    );
  }

  // Not authenticated — render nothing while redirect fires
  if (isError || !profile) {
    return null;
  }

  // Wrong role — render nothing while redirect fires
  const hasRoleAccess =
    !allowedRoles || allowedRoles.length === 0 || allowedRoles.includes(role);

  if (!hasRoleAccess) {
    return null;
  }

  return <>{children}</>;
}
