"use client";

export type UserRole = "admin" | "user" | string;

const isBrowser = () => typeof window !== "undefined";

const decodePayload = (token: string) => {
  const [, payload] = token.split(".");
  if (!payload) {
    throw new Error("Invalid token");
  }

  const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
  const decoded = atob(normalizedPayload);
  const jsonPayload = decodeURIComponent(
    decoded
      .split("")
      .map((char) => "%" + ("00" + char.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );

  return JSON.parse(jsonPayload);
};

const getStoragePair = (persist: boolean) => {
  if (!isBrowser()) {
    return [null, null] as const;
  }

  const primary = persist ? window.localStorage : window.sessionStorage;
  const secondary = persist ? window.sessionStorage : window.localStorage;

  return [primary, secondary] as const;
};

const isTokenPersisted = () => {
  if (!isBrowser()) return true;
  const hasLocal =
    window.localStorage.getItem("token") ||
    window.localStorage.getItem("refresh_token");
  if (hasLocal) return true;
  const hasSession =
    window.sessionStorage.getItem("token") ||
    window.sessionStorage.getItem("refresh_token");
  if (hasSession) return false;
  return true;
};

export const getTokenPersistence = () => (isTokenPersisted() ? "local" : "session");

export const getRoleFromToken = (token?: string | null): UserRole | null => {
  if (!token) return null;

  try {
    const payload = decodePayload(token);
    return (
      payload?.role ||
      payload?.user_role ||
      payload?.user?.role ||
      payload?.data?.role ||
      null
    );
  } catch (error) {
    console.error("Failed to decode token role:", error);
    return null;
  }
};

export const getUsernameFromToken = (token?: string | null): string | null => {
  if (!token) return null;

  try {
    const payload = decodePayload(token);
    return (
      payload?.username ||
      payload?.user?.username ||
      payload?.data?.username ||
      payload?.user_name ||
      null
    );
  } catch (error) {
    console.error("Failed to decode token username:", error);
    return null;
  }
};

export const getStoredAccessToken = (): string | null => {
  if (!isBrowser()) return null;
  return (
    window.localStorage.getItem("token") ||
    window.sessionStorage.getItem("token")
  );
};

export const getStoredRefreshToken = (): string | null => {
  if (!isBrowser()) return null;
  return (
    window.localStorage.getItem("refresh_token") ||
    window.sessionStorage.getItem("refresh_token")
  );
};

export const clearStoredTokens = () => {
  if (!isBrowser()) return;
  window.localStorage.removeItem("token");
  window.localStorage.removeItem("refresh_token");
  window.sessionStorage.removeItem("token");
  window.sessionStorage.removeItem("refresh_token");
};

export const storeAuthTokens = ({
  accessToken,
  refreshToken,
  persist,
}: {
  accessToken?: string;
  refreshToken?: string;
  persist?: boolean;
}) => {
  if (!isBrowser()) return;

  const shouldPersist =
    typeof persist === "boolean" ? persist : isTokenPersisted();

  const [primary, secondary] = getStoragePair(shouldPersist);
  if (!primary || !secondary) return;

  if (accessToken) {
    primary.setItem("token", accessToken);
    secondary.removeItem("token");
  } else {
    primary.removeItem("token");
    secondary.removeItem("token");
  }

  if (refreshToken) {
    primary.setItem("refresh_token", refreshToken);
    secondary.removeItem("refresh_token");
  } else {
    primary.removeItem("refresh_token");
    secondary.removeItem("refresh_token");
  }
};

