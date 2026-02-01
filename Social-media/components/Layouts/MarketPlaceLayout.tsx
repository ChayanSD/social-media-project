"use client";

import { useState } from "react";
import { FiMenu } from "react-icons/fi";
import bg from "../../public/main-bg.jpg";
import Link from "next/link";
import { usePathname } from "next/navigation";
import MarketplaceSidebar from "../Features/Marketplace/Sidebar/MarketplaceSidebar";

const topNavLinks = [
  { label: "Browse", href: "/marketplace" },
  { label: "Categories", href: "/marketplace/categories" },
  { label: "Promote Service", href: "/marketplace/promote" },
];

export default function MarketPlaceLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;

  return (
    <div
      style={{
        backgroundImage: `url(${bg.src})`,
        scrollbarGutter: "stable both-edges",
      }}
      className="bg-cover bg-center h-screen bg-no-repeat p-3 lg:p-10 flex flex-col md:flex-row text-white"
    >
      {/* Unified container with backdrop blur */}
      <div className="w-full flex flex-col md:flex-row gap-0 backdrop-blur-xl bg-black/40 rounded-lg overflow-hidden h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <MarketplaceSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {isSidebarOpen && (
          <div
            className="fixed inset-0  backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header */}
          <header className="flex flex-col gap-3 p-3 md:p-4 border-b border-white/10 sticky top-0 z-20">
            <div className="flex items-center justify-between gap-3">
              <button
                className="lg:hidden text-white"
                onClick={() => setIsSidebarOpen(true)}
              >
                <FiMenu size={24} />
              </button>

              {/* <input
                type="text"
                placeholder="Search..."
                className="w-full lg:w-96 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm focus:outline-none placeholder:text-gray-300"
              /> */}
              <div></div>
              <h2 className="text-lg font-semibold lg:hidden">Marketplace</h2>

              {/* Desktop nav */}
              <nav className="hidden lg:flex items-center gap-2 bg-white/10 rounded-full p-1.5">
                {topNavLinks.map((btn) => (
                  <Link href={btn.href} key={btn.label}>
                    <button
                      className={`px-4 py-2 rounded-full cursor-pointer text-sm transition-colors ${isActive(btn.href)
                        ? "bg-[#06133fbf] text-white font-medium"
                        : "hover:bg-white/10"
                        }`}
                    >
                      {btn.label}
                    </button>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Mobile and tablet nav */}
            <nav className="flex lg:hidden overflow-x-auto gap-2 scrollbar-hide bg-white/10 rounded-full p-2">
              {topNavLinks.map((btn) => (
                <Link href={btn.href} key={btn.label}>
                  <button
                    className={`px-4 py-1.5 rounded-full cursor-pointer text-sm whitespace-nowrap ${isActive(btn.href)
                      ? "bg-[#06133fbf] text-white font-medium"
                      : "bg-white/10 hover:bg-white/20"
                      }`}
                  >
                    {btn.label}
                  </button>
                </Link>
              ))}
            </nav>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-2 md:p-8 custom-scroll-marketplace min-h-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
