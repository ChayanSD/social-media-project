"use client";
import React from "react";
import HomeLayout from "../../../../components/Layouts/HomeLayout";
import HomeLayoutTwo from "../../../../components/Layouts/HomeLayoutTwo";
import ProtectedLayout from "../../../../components/Layouts/ProtectedLayout";
import { usePathname } from "next/navigation";

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Use HomeLayoutTwo for profile and community details pages
  const useHomeLayoutTwo =
    pathname === "/main/profile" ||
    (pathname?.startsWith("/main/communities/") && pathname !== "/main/communities") || pathname.includes("main/user/");

  return (
    <ProtectedLayout>
      {useHomeLayoutTwo ? (
        <HomeLayoutTwo>{children}</HomeLayoutTwo>
      ) : (
        <HomeLayout>{children}</HomeLayout>
      )}
    </ProtectedLayout>
  );
}
