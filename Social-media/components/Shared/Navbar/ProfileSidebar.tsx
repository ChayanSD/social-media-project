"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiX,
  FiEdit3,
  FiSettings,
  FiShield,
  FiHelpCircle,
  FiLogOut,
} from "react-icons/fi";
import Image from "next/image";
import Link from "next/link";
import { FaRegCircleUser } from "react-icons/fa6";
import { IoPersonOutline, IoPieChartOutline } from "react-icons/io5";
import { UserProfile } from "@/store/authApi";
import { useRouter } from "next/navigation";
import { clearStoredTokens, getRoleFromToken, getStoredAccessToken } from "@/lib/auth";
import { store } from "@/store/store";
import { baseApi } from "@/store/baseApi";

interface ProfileSidebarProps {
  onClose: () => void;
  profile?: UserProfile | null;
  isLoadingProfile: boolean;
  isError?: boolean;
}
const profileItems = [
  {
    label: "Profile",
    href: "/main/profile",
    icon: FaRegCircleUser,
  },
  {
    label: "Edit Profile",
    href: "/main/edit-profile",
    icon: FiEdit3,
  },
  {
    label: "Privacy",
    href: "/privacy",
    icon: FiShield,
  },
  {
    label: "Help & Support",
    href: "/help-support",
    icon: FiHelpCircle,
  },
];

const ProfileSidebar = ({
  onClose,
  profile,
  isLoadingProfile,
  isError,
}: ProfileSidebarProps) => {
  const [isClosing, setIsClosing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const router = useRouter();

  const role = useMemo(() => {
    const token = getStoredAccessToken();
    return getRoleFromToken(token);
  }, []);

  const isAdmin = role === 'admin';

  useEffect(() => {
    document.body.style.overflow = "hidden";
    setTimeout(() => {
      setIsOpen(true);
    }, 10);
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncToken = () => {
      const token = getStoredAccessToken();
      setAuthToken(token);
    };

    syncToken();

    window.addEventListener("storage", syncToken);
    return () => {
      window.removeEventListener("storage", syncToken);
    };
  }, []);

  const decodeTokenExpiry = useCallback((token: string): number | null => {
    try {
      const parts = token.split(".");
      if (parts.length < 2) return null;
      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
      if (typeof payload.exp === "number") {
        return payload.exp * 1000;
      }
      return null;
    } catch (error) {
      console.error("Failed to decode token payload", error);
      return null;
    }
  }, []);

  const handleLogout = useCallback(() => {
    clearStoredTokens();
    setAuthToken(null);
    // Clear RTK Query cache
    store.dispatch(baseApi.util.resetApiState());
    // Clear user data from storage
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("user");
      window.sessionStorage.removeItem("user");
      window.localStorage.removeItem("role");
      window.sessionStorage.removeItem("role");
    }
    onClose();
    router.push("/login");
  }, [onClose, router]);

  useEffect(() => {
    if (!authToken) return;
    const expiryTime = decodeTokenExpiry(authToken);

    if (expiryTime && expiryTime <= Date.now()) {
      handleLogout();
      return;
    }

    const timeoutId =
      expiryTime && expiryTime > Date.now()
        ? window.setTimeout(() => {
          handleLogout();
        }, expiryTime - Date.now())
        : null;

    const intervalId = window.setInterval(() => {
      const latestToken = getStoredAccessToken();
      if (!latestToken) {
        handleLogout();
        return;
      }
      const latestExpiry = decodeTokenExpiry(latestToken);
      if (latestExpiry && latestExpiry <= Date.now()) {
        handleLogout();
      }
    }, 60 * 1000);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      clearInterval(intervalId);
    };
  }, [authToken, decodeTokenExpiry, handleLogout]);

  const handleClose = () => {
    setIsClosing(true);
    setIsOpen(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const safeHref = (href: string) => (href.startsWith("/") ? href : `/${href}`);

  const profileImage =
    (profile?.profile_image as string) ||
    (profile?.avatar as string) ||
    null;
  const profileName =
    profile?.display_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
    profile?.username ||
    "";
  const profileEmail = profile?.email || profile?.username || "";

  const showSignOut = useMemo(() => Boolean(authToken && profile), [authToken, profile]);

  return (
    <div
      className={`fixed top-0 right-0 h-full w-full bg-black/50 z-50 duration-300 transition-all ${isClosing ? "opacity-0" : "opacity-100"
        }`}
      onClick={handleClose}
    >
      <div
        className={`fixed top-0 right-0 w-full max-w-xs h-full bg-[#06133FBF]/80 backdrop-blur-[17.5px] transition-transform duration-300 ease-in-out ${isOpen && !isClosing ? "translate-x-0" : "translate-x-full"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="py-2.5 px-4 border-b border-gray-500">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Profile</h2>
            <button
              className="text-2xl cursor-pointer hover:bg-gray-700/20 rounded-full p-2 transition-colors duration-200"
              onClick={handleClose}
            >
              <FiX size={24} className="text-white" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col items-center mb-6 text-white">
            <div className="rounded-full h-[80px] w-[80px] overflow-hidden border border-white/30 mb-4">
              {profileImage ? (
                <Image
                  src={profileImage}
                  alt={profileName || "profile"}
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                  unoptimized={true}
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-[#6c3f79] via-[#995a98] to-[#6c3f79] flex items-center justify-center">
                  <IoPersonOutline className="text-white" size={40} />
                </div>
              )}
            </div>
            {isLoadingProfile ? (
              <div className="text-center space-y-1 w-full animate-pulse">
                <div className="h-4 bg-white/20 rounded w-1/2 mx-auto" />
                <div className="h-3 bg-white/10 rounded w-3/4 mx-auto" />
              </div>
            ) : (
              <>
                <h3 className="text-xl font-semibold">
                  {profileName || (isError ? "Unable to load user" : "Unknown User")}
                </h3>
                <p className="text-sm text-white/80">
                  {profileEmail || (isError ? "Please try again later" : "No email available")}
                </p>
              </>
            )}
          </div>

          <div className="flex flex-col">
            {profileItems?.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={index}
                  href={safeHref(item.href)}
                  className="w-full text-sm text-left p-3 hover:bg-white/10 rounded-lg transition-colors duration-200 flex items-center gap-3"
                >
                  <IconComponent size={20} className="text-white" />
                  <span className="text-white font-medium">{item.label}</span>
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                href="/dashboard"
                className="w-full text-sm text-left p-3 hover:bg-white/10 rounded-lg transition-colors duration-200 flex items-center gap-3"
              >
                <IoPieChartOutline size={20} className="text-white" />
                <span className="text-white font-medium">Dashboard</span>
              </Link>
            )
            }
            {showSignOut && (
              <button
                onClick={handleLogout}
                className="w-full text-sm text-left p-3 hover:bg-red-700/60 rounded-lg transition-colors duration-200 flex items-center gap-3 cursor-pointer text-white font-medium mt-2 border border-white/10"
              >
                <FiLogOut size={20} />
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSidebar;
