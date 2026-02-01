"use client";
import { useState, useEffect } from "react";
import SidebarNavLink from "../../components/Shared/SidebarNavLink/SidebarNavLink";
import bg from "../../public/main-bg.jpg";
import Navbar from "../Shared/Navbar/Navbar";
import { SearchProvider } from "@/contexts/SearchContext";
import { MessageProvider } from "@/contexts/MessageContext";

export default function HomeLayoutTwo({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        setIsOpen(true);
      }, 10);
    } else {
      document.body.style.overflow = "unset";
      setIsOpen(false);
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isSidebarOpen]);

  const handleCloseSidebar = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsSidebarOpen(false);
      setIsClosing(false);
    }, 300);
  };

  return (
    <div
      style={{
        backgroundImage: `url(${bg.src})`,
        scrollbarGutter: "stable both-edges",
      }}
      className="bg-cover bg-center bg-no-repeat h-screen flex scrollbar-hide"
    >
      {isSidebarOpen && (
        <div
          className={`fixed top-0 left-0 h-full w-full bg-black/50 z-50 lg:z-30 duration-300 transition-all lg:hidden ${isClosing ? "opacity-0" : "opacity-100"
            }`}
          onClick={handleCloseSidebar}
        >
          <SidebarNavLink 
            isSidebarOpen={isOpen && !isClosing}
            onClose={handleCloseSidebar}
            className={`${isOpen && !isClosing ? "translate-x-0" : "-translate-x-full"} px-6`}
          />
        </div>
      )}

      <SidebarNavLink 
        isSidebarOpen={true}
        className="hidden lg:block px-6"
        showMobileHeader={false}
      />

      {/* Main Content */}
      <main
        className={`flex-1 overflow-y-auto transition-all duration-300
          lg:ml-[370px]
        `}
      >
        <SearchProvider>
          <MessageProvider>
            <div className=" mx-auto mt-28">
              <Navbar onMenuToggle={() => setIsSidebarOpen(prev => !prev)} />
              {children}
            </div>
          </MessageProvider>
        </SearchProvider>
      </main>
    </div>
  );
}
