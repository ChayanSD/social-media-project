"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredAccessToken } from "@/lib/auth";
import Home from "../../../components/Features/Main/Home/Home";

/**
 * Root page - Shows main home for authenticated users
 * Redirects unauthenticated users to /explore
 */
export default function HomePage() {
  const router = useRouter();
  const token = getStoredAccessToken();

  useEffect(() => {
    if (!token) {
      // User is not authenticated, redirect to public explore page
      router.replace("/explore");
    }
  }, [token, router]);

  // If not authenticated, show loading while redirecting
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#06133F]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Show main home page for authenticated users
  return <Home />;
}
