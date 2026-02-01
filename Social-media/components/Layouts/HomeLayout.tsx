"use client";
import React, { useState } from "react";
import Navbar from "../Shared/Navbar/Navbar";
import bg from "../../public/main-bg.jpg";
import SidebarNavLink from "../Shared/SidebarNavLink/SidebarNavLink";
import RightSidebar from "../Shared/SidebarNavLink/RightSidebar";
import { SearchProvider } from "@/contexts/SearchContext";
import { MessageProvider } from "@/contexts/MessageContext";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
              className="flex-1 h-[calc(100vh)] overflow-y-auto bg-cover bg-center bg-no-repeat relative scrollbar-hide"
            >
              <div className=" bg-[#06133F]/75 backdrop-blur-[12px]">
                <div className="xl:max-w-[47vw] mx-auto pt-32 pb-4">
                  {children}
                </div>
              </div>
            </main>



            {/* RIGHT SIDEBAR */}
            <aside
              style={{
                backgroundImage: `url(${bg.src})`,
                scrollbarGutter: "stable both-edges",
              }}
              className="bg-cover bg-center bg-no-repeat hidden xl:block fixed right-0 h-[calc(100vh)] p-10 shadow-md hover:overflow-y-auto overflow-y-hidden custom-scroll xl:w-[370px]"
            >
              <div>
                <RightSidebar />
              </div>
            </aside>
          </div>
        </div>
      </MessageProvider>
    </SearchProvider>
  );
}
