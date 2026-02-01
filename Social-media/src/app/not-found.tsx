import Link from "next/link";
import Image from "next/image";
import React from "react";

export default function NotFoundPage() {
  return (
    <main
      className="relative h-screen flex items-center justify-center px-4 bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: "url(/main-bg.jpg)" }}
    >
      <div className="absolute inset-0 bg-[#06133f]/85 bg-cover bg-center bg-no-repeat backdrop-blur-[17.5px]" />

      {/* Decorative glows */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />

      <div className="relative w-full max-w-2xl text-center">
        <div className="bg-[#022735]/80 backdrop-blur-md text-white rounded-3xl p-8 md:p-12 shadow-2xl ring-1 ring-white/10">
          <div className="flex items-center justify-center mb-6">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
              <Image src="/logo.png" alt="Raddit" width={36} height={36} />
            </span>
          </div>

          <div className="mb-3 text-[56px] leading-none md:text-[72px] font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-white via-cyan-200 to-emerald-200 bg-clip-text text-transparent">
              404
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-semibold">Page not found</h1>
          <p className="mt-2 text-sm md:text-base text-white/80">
            The page you’re looking for doesn’t exist, has been moved, or is temporarily unavailable.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full px-6 py-3 bg-white text-[#022735] font-medium transition-all hover:bg-gray-100 hover:shadow-lg"
            >
              Go to Home
            </Link>
            <Link
              href="/popular"
              className="inline-flex items-center justify-center rounded-full px-6 py-3 bg-white/10 text-white font-medium transition-all hover:bg-white/20 ring-1 ring-white/15"
            >
              Explore Popular
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
