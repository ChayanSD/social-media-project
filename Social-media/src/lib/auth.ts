"use client";

/**
 * auth.ts — Minimal auth helpers after cookie migration.
 *
 * Token storage has been removed. Access tokens are now HttpOnly cookies
 * managed entirely by the backend. Role/identity is sourced from the
 * /auth/user-profiles/me/ API response via RTK Query.
 *
 * This file exists only for the UserRole type used across the app.
 */

export type UserRole = "admin" | "user" | string;

export const getCookieValue = (name: string): string | null => {
  if (typeof document === "undefined") {
    return null;
  }

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

export const getCsrfToken = (): string | null => getCookieValue("csrftoken");
