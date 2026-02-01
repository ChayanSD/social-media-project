"use client";
import Image from "next/image";
import { useState, useEffect, useRef, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  Home,
  Users,
  LayoutDashboard,
  FileText,
  LogOut,
  BarChart2,
  ChevronRight,
  Tag,
  ShoppingBag,
  Package,
  Menu,
  Flag,
  Mail,
  UsersRound,
  MessageSquare,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useGetCurrentUserProfileQuery } from "@/store/authApi";
import { clearStoredTokens, getUsernameFromToken, getStoredAccessToken, getRoleFromToken } from "@/lib/auth";
import { store } from "@/store/store";
import { baseApi } from "@/store/baseApi";
import { toast } from "sonner";

const menu = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { name: "Users", icon: Users, path: "/dashboard/user-management" },
  { name: "All Posts", icon: FileText, path: "/dashboard/all-posts" },
  { name: "Communities", icon: UsersRound, path: "/dashboard/communities" },
  { name: "Conversations", icon: MessageSquare, path: "/dashboard/conversations" },
  { name: "Reports", icon: Flag, path: "/dashboard/reported-posts" },
  { name: "All Services", icon: Package, path: "/dashboard/all-services" },
  { name: "Payments", icon: CreditCard, path: "/dashboard/payments" },
  { name: "Subscriptions", icon: Users, path: "/dashboard/subscriptions" },
  { name: "Subscription Plans", icon: CreditCard, path: "/dashboard/subscription-plans" },
  { name: "Interest Category", icon: Tag, path: "/dashboard/interest-categories" },
  { name: "Service Category", icon: ShoppingBag, path: "/dashboard/marketplace-categories" },
  { name: "Contacts", icon: Mail, path: "/dashboard/contacts" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [active, setActive] = useState("Home");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Fetch current user profile - MUST be called before any conditional returns
  const { data: profileResponse, refetch: refetchProfile } = useGetCurrentUserProfileQuery();
  const profile = profileResponse?.data;

  // Get username from token or profile
  const username = profile?.display_name || profile?.username || getUsernameFromToken(getStoredAccessToken()) || "User";

  // Check admin authentication
  const token = getStoredAccessToken();
  const role = useMemo(() => getRoleFromToken(token), [token]);

  // Sync active state with current pathname - MUST be called before any conditional returns
  useEffect(() => {
    const currentMenuItem = menu.find((item) => {
      // Handle exact match for home
      if (item.path === "/dashboard") {
        return pathname === "/dashboard" || pathname === "/dashboard/";
      }
      // Handle other paths
      return pathname?.startsWith(item.path);
    });

    if (currentMenuItem) {
      setActive(currentMenuItem.name);
    }
  }, [pathname]);

  // Close dropdown when clicking outside - MUST be called before any conditional returns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Authentication check - MUST be called before any conditional returns
  useEffect(() => {
    setIsCheckingAuth(false);

    // Check if user is authenticated
    if (!token) {
      router.replace("/dashboard/auth");
      return;
    }

    // Check if token is expired
    try {
      const [, payload] = token.split(".");
      if (payload) {
        const data = JSON.parse(
          atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
        );
        if (typeof data.exp === "number" && data.exp * 1000 <= Date.now()) {
          clearStoredTokens();
          router.replace("/dashboard/auth");
          return;
        }
      }
    } catch {
      clearStoredTokens();
      router.replace("/dashboard/auth");
      return;
    }

    // Check if user is admin
    if (role !== "admin") {
      router.replace("/dashboard/auth");
      return;
    }
  }, [token, role, router]);

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1F2149] text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render if not admin (will redirect)
  if (role !== "admin") {
    return null;
  }

  // Handle logout
  const handleLogout = () => {
    try {
      // Clear tokens
      clearStoredTokens();

      // Clear RTK Query cache
      store.dispatch(baseApi.util.resetApiState());

      // Clear user data from storage
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("user");
        window.sessionStorage.removeItem("user");
        window.localStorage.removeItem("role");
        window.sessionStorage.removeItem("role");
      }

      // Close dropdown if open
      setIsDropdownOpen(false);

      // Show success message
      toast.success("Logged out successfully");

      // Redirect to admin login page
      router.push("/dashboard/auth");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error during logout");
      // Still redirect even if there's an error
      router.push("/dashboard/auth");
    }
  };

  // Handle home navigation
  const handleHome = () => {
    setIsDropdownOpen(false);
    router.push("/");
  };

  const renderMenuItems = (onItemClick?: () => void) =>
    menu.map((item) => {
      const Icon = item.icon;
      const isActive = active === item.name;
      return (
        <Link
          key={item.name}
          href={item.path}
          className="block"
          onClick={() => {
            setActive(item.name);
            onItemClick?.();
          }}
        >
          <button
            className={`flex items-center w-full px-4 py-3 rounded-xl cursor-pointer text-left text-sm font-medium transition
            ${isActive
                ? "bg-[#6B83FA] text-white"
                : "bg-transparent text-white"
              }`}
          >
            <Icon className="w-4 h-4 mr-3" />
            {item.name}

            <span className="ml-auto">
              <ChevronRight className="w-4 h-4 ml-auto" />
            </span>
          </button>
        </Link>
      );
    });

  return (
    <div
      style={{ backgroundImage: "url('/admin-bg.jpg')" }}
      className="flex h-screen bg-cover bg-center text-white p-4 overflow-hidden"
    >
      {/* MOBILE SIDEBAR DRAWER */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        >
          <aside
            className="absolute left-0 top-0 h-full w-72 bg-black/30 backdrop-blur-sm text-gray-900 rounded-r-xl p-6 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* LOGO */}
            <div className="flex items-center justify-between mb-6">
              <Image src="/logo.png" alt="Logo" width={240} height={40} />
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded-full hover:bg-gray-200 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* MENU */}
            <nav className="space-y-6 flex-1 overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {renderMenuItems(() => setIsSidebarOpen(false))}
            </nav>

            {/* LOGOUT */}
            <button
              onClick={handleLogout}
              className="flex cursor-pointer items-center text-sm text-red-600 hover:text-red-500 transition mt-4 w-full"
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </button>
          </aside>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex w-72 bg-black/30 backdrop-blur-sm text-gray-900 rounded-xl p-6 shadow-xl flex-col h-full">
        {/* LOGO */}
        <div className="flex items-center justify-center mb-6">
          <Image src="/logo.png" alt="Logo" width={240} height={40} />
        </div>

        {/* MENU */}
        <nav className="space-y-6 flex-1 overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {renderMenuItems()}
        </nav>

        {/* LOGOUT → STAYS AT BOTTOM */}
        <button
          onClick={handleLogout}
          className="flex cursor-pointer items-center text-sm text-red-600 hover:text-red-500 transition mt-4 w-full"
        >
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </button>
      </aside>

      {/* MAIN AREA */}
      <main className="flex-1 relative rounded-xl lg:ml-4 h-full flex flex-col">
        {/* FIXED TOP BAR */}
        <div className="sticky top-0 left-0 z-20 flex items-center justify-between px-4 md:px-10 py-4 md:py-6 rounded-xl">
          {/* Mobile menu button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 rounded-full bg-black/30 border border-white/20 hover:bg-black/50 transition cursor-pointer"
            aria-label="Open admin menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 flex justify-end lg:mr-[2.5vw]">

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="bg-[#6B83FA] px-6 md:px-8 py-3 md:py-4 rounded-[10px] flex items-center text-base md:text-xl hover:bg-[#5a6fe8] transition-colors cursor-pointer mr-16 lg:mr-3"
              >
                <span>Hi {username}</span>
                <ChevronDown className={`w-5 h-5 md:w-6 md:h-6 ml-2 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-14 mt-2 w-48 bg-black/30 backdrop-blur-sm rounded-lg shadow-lg border border-gray-400 py-2 z-50">
                  <button
                    onClick={handleHome}
                    className="w-full px-4 py-2 text-left text-gray-100 hover:bg-gray-700 cursor-pointer flex items-center gap-2 transition-colors"
                  >
                    <Home className="w-4 h-4 text-white" />
                    <span>Home</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-500 hover:text-white cursor-pointer flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SCROLLABLE INNER CONTENT */}
        <div className="flex-1 w-[95vw] lg:max-w-[80vw] overflow-y-auto px-4 md:px-10 py-4 md:py-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {children}
        </div>
      </main>
    </div>
  );
}
