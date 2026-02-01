"use client";

import React from "react";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-blue-200/80">
            Admin Dashboard
          </p>
          <h1 className="text-lg font-semibold">Control Center</h1>
        </div>

        <nav className="flex items-center gap-4 text-sm">
          <Link href="/dashboard" className="hover:text-blue-300 transition">
            Overview
          </Link>
          <Link href="/dashboard/users" className="hover:text-blue-300 transition">
            Users
          </Link>
          <Link
            href="/dashboard/content"
            className="hover:text-blue-300 transition"
          >
            Content
          </Link>
        </nav>
      </header> */}

      <main>{children}</main>
    </div>
  );
}

