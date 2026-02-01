"use client";
import React, { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import Navbar from "../Shared/Navbar/Navbar";
import bg from "../../public/main-bg.jpg";
import SidebarNavLink from "../Shared/SidebarNavLink/SidebarNavLink";
import { usePathname } from "next/navigation";
import RightSidebar from "../Shared/SidebarNavLink/RightSidebar";
import { SearchProvider } from "@/contexts/SearchContext";
import { MessageProvider } from "@/contexts/MessageContext";

/**
 * Public Layout - Allows both authenticated and unauthenticated users
 * Includes left sidebar, main content, and right sidebar
 * Design matches HomeLayout.tsx
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <SearchProvider>
      <MessageProvider>
        <div className="flex flex-col">
          <Navbar onMenuToggle={() => setIsSidebarOpen(prev => !prev)} />

          <div className="flex flex-1">
            {/* LEFT SIDEBAR */}
            <SidebarNavLink 
              isSidebarOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
            />

            {isSidebarOpen && (
              <div
                className="fixed inset-0 bg-black/40 z-20 xl:hidden"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            {/* MAIN CONTENT */}
            <main
              style={{
                backgroundImage: `url(${bg.src})`,
                scrollbarGutter: "stable both-edges",
              }}
              className="flex-1 scrollbar-hide h-[calc(100vh)] overflow-y-auto bg-cover bg-center bg-no-repeat relative"
            >
              <div className=" bg-[#06133F]/75 backdrop-blur-[12px]">
                <div className="xl:max-w-[47vw] mx-auto pt-32 pb-4">
                  {children}
                </div>
              </div>
            </main>

            {/* Mobile Right Sidebar Toggle Button */}
            {pathname !== "/create-post" && (
              <button
                onClick={() => setIsRightSidebarOpen(true)}
                className="xl:hidden fixed bottom-6 right-6 z-40 bg-[#6B83FA] hover:bg-[#517EE0] text-white p-4 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center"
                aria-label="Open right sidebar"
              >
                <FiMenu size={24} />
              </button>
            )}

            {/* RIGHT SIDEBAR - Desktop */}
            {pathname === "/create-post" ? null : (
              <>
                {/* Desktop Right Sidebar */}
                <aside
                  style={{
                    backgroundImage: `url(${bg.src})`,
                    scrollbarGutter: "stable both-edges",
                  }}
                  className="bg-cover bg-center bg-no-repeat hidden xl:block fixed right-0 h-[calc(100vh)] p-10 shadow-md hover:overflow-y-auto overflow-y-hidden custom-scroll xl:w-[370px]"
                >
                  <div className="mt-20">
                    <RightSidebar />
                  </div>
                </aside>

                {/* Mobile Right Sidebar Drawer */}
                <>
                  {/* Backdrop */}
                  {isRightSidebarOpen && (
                    <div
                      className="fixed inset-0 bg-black/50 z-40 xl:hidden transition-opacity duration-300"
                      onClick={() => setIsRightSidebarOpen(false)}
                    />
                  )}

                  {/* Drawer */}
                  <aside
                    style={{
                      backgroundImage: `url(${bg.src})`,
                      scrollbarGutter: "stable both-edges",
                    }}
                    className={`fixed right-0 top-0 h-full w-[370px] bg-cover bg-center bg-no-repeat shadow-2xl transform transition-transform duration-300 ease-in-out z-50 xl:hidden overflow-y-auto custom-scroll
                      ${isRightSidebarOpen ? "translate-x-0" : "translate-x-full"}
                    `}
                  >
                    <div className="bg-[#06133F]/10  h-full p-6">
                      {/* Header with close button */}
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="font-semibold text-lg text-white">Explore</h2>
                        <button
                          onClick={() => setIsRightSidebarOpen(false)}
                          className="p-2 rounded-full hover:bg-white/10 transition text-white"
                          aria-label="Close sidebar"
                        >
                          <FiX size={24} />
                        </button>
                      </div>

                      {/* Right Sidebar Content */}
                      <div className="mt-4">
                        <RightSidebar />
                      </div>
                    </div>
                  </aside>
                </>
              </>
            )}
          </div>
        </div>
      </MessageProvider>
    </SearchProvider>
  );
}

