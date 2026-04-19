"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useGetCurrentUserProfileQuery } from "@/store/authApi";
import { Compass, Home, PlusCircle, Store, UserRound } from "lucide-react";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Explore", href: "/explore", icon: Compass },
  { label: "Create", href: "/main/create", icon: PlusCircle, requiresAuth: true, featured: true },
  { label: "Marketplace", href: "/marketplace", icon: Store, requiresAuth: true },
  { label: "Profile", href: "/main/profile", icon: UserRound, requiresAuth: true },
];

const isActivePath = (pathname: string, href: string) => {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
};

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: profileResponse } = useGetCurrentUserProfileQuery();
  const isAuthenticated = !!profileResponse?.data;

  return (
    <nav className="xl:hidden fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#06133F]/90 backdrop-blur-xl px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_35px_rgba(0,0,0,0.25)]">
      <div className="mx-auto grid max-w-2xl grid-cols-5 items-end gap-1 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href) || (item.href === "/explore" && pathname === "/explore");
          const targetHref = item.requiresAuth && !isAuthenticated ? "/login" : item.href;

          const content = (
            <span
              className={`flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-medium transition-colors ${
                active
                  ? "text-white"
                  : "text-white/55 hover:bg-white/10 hover:text-white"
              } ${item.featured ? "-mt-5" : ""}`}
            >
              <span
                className={`flex items-center justify-center rounded-full transition-all ${
                  item.featured
                    ? "h-12 w-12 bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                    : active
                      ? "h-8 w-8 bg-white/15"
                      : "h-8 w-8"
                }`}
              >
                <Icon size={item.featured ? 24 : 20} />
              </span>
              <span className="truncate">{item.label}</span>
            </span>
          );

          return (
            <Link
              key={item.label}
              href={targetHref}
              onClick={(event) => {
                if (item.requiresAuth && !isAuthenticated) {
                  event.preventDefault();
                  router.push("/login");
                }
              }}
              aria-current={active ? "page" : undefined}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
