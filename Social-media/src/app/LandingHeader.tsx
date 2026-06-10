"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/how-it-works", label: "How It Works" },
  { href: "/features", label: "Features" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact Us" },
];

export default function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full max-w-[1440px] mx-auto px-6 py-6 md:py-8 flex items-center justify-between bg-black/95 backdrop-blur-md border-b border-zinc-800/80">
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Interdimensional Cafe Logo"
              width={32}
              height={32}
              className="object-cover w-full h-full"
              priority
            />
          </div>
          <span className="text-xl font-semibold tracking-tight text-white select-none">
            Interdimensional Cafe
          </span>
        </Link>

        <div className="hidden md:flex items-center flex-1">
          <div className="flex-1 h-[1px] bg-zinc-800/80 mx-8" />

          <nav className="flex items-center gap-8 shrink-0 text-sm font-medium text-white">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition-colors duration-200 hover:text-[#FF7826]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex-1 h-[1px] bg-zinc-800/80 mx-8" />
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <Link
            href="/sign-up"
            className="hidden md:inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-[#FF7826] text-white font-semibold text-sm transition-all duration-300 hover:bg-[#FF7826]/90 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#FF7826]/20"
          >
            Join the Community
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-white focus:outline-none"
            aria-label="Toggle menu"
            type="button"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-[#000000] z-40 flex flex-col justify-between p-6 pt-24 animate-in fade-in slide-in-from-top-4 duration-300 md:hidden">
          <nav className="flex flex-col gap-6 text-2xl font-medium text-white">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 border-b border-zinc-900 transition-colors hover:text-[#FF7826]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-4">
            <Link
              href="/sign-up"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-4 rounded-xl bg-[#FF7826] text-white font-semibold text-base shadow-lg shadow-[#FF7826]/20"
            >
              Join the Community
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
