"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearStoredTokens,
  getRoleFromToken,
  getStoredAccessToken,
  UserRole,
} from "@/lib/auth";

type ProtectedLayoutProps = {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  fallbackRedirect?: string;
  unauthenticatedRedirect?: string;
};

export default function ProtectedLayout({
  children,
  allowedRoles,
  fallbackRedirect,
  unauthenticatedRedirect,
}: ProtectedLayoutProps) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    setToken(getStoredAccessToken());
    setIsBootstrapping(false);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorage = () => {
      setToken(getStoredAccessToken());
    };

    window.addEventListener("storage", handleStorage);

    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const isExpired = useMemo(() => {
    if (!token) return false;
    try {
      const [, payload] = token.split(".");
      if (!payload) return false;
      const data = JSON.parse(
        atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
      );
      return typeof data.exp === "number" && data.exp * 1000 <= Date.now();
    } catch {
      return false;
    }
  }, [token]);

  useEffect(() => {
    if (isBootstrapping) return;

    if (!token || isExpired) {
      clearStoredTokens();
      const redirectTarget = unauthenticatedRedirect || "/login";
      router.replace(redirectTarget);
      return;
    }

    const role = getRoleFromToken(token) || "user";
    const hasRoleAccess =
      !allowedRoles ||
      allowedRoles.length === 0 ||
      allowedRoles.includes(role);

    if (!hasRoleAccess) {
      const redirectTarget =
        fallbackRedirect || (role === "admin" ? "/dashboard" : "/");
      router.replace(redirectTarget);
    }
  }, [allowedRoles, fallbackRedirect, unauthenticatedRedirect, isBootstrapping, isExpired, router, token]);

  if (isBootstrapping) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Checking authentication...
      </div>
    );
  }

  if (!token || isExpired) {
    return null;
  }

  return <>{children}</>;
}

