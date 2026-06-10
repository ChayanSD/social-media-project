import Image from "next/image";
import Link from "next/link";

const footerLinks = [
  { href: "/how-it-works", label: "How It Works" },
  { href: "/features", label: "Features" },
  { href: "/why-it-matters", label: "Why It Matters" },
  { href: "/categories", label: "Categories" },
  { href: "/faqs", label: "FAQs" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact Us" },
  { href: "/privacy-policy", label: "Privacy Policy" },
];

export default function LandingFooter() {
  return (
    <footer className="w-full flex flex-col items-center justify-center mt-8">
      <div className="w-full border-t border-zinc-800/80" />

      <div className="flex flex-col items-center py-16 md:py-24 text-center px-6">
        <div className="flex items-center gap-3 mb-6">
          <Image
            src="/logo.png"
            alt="Interdimensional Cafe Logo"
            width={48}
            height={48}
            className="rounded-xl object-cover shadow-lg"
          />
          <span className="text-white text-2xl font-semibold tracking-tight">
            Interdimensional Cafe
          </span>
        </div>

        <h2 className="text-white text-2xl md:text-[28px] font-medium leading-[1.3] mb-8 tracking-wide">
          Where Quantum Science
          <br />
          Meets Spiritual Awakening
        </h2>

        <Link
          href="/sign-up"
          className="bg-[#FF7826] hover:bg-[#FF7826]/90 text-white font-semibold text-sm px-8 py-3 rounded-lg transition-colors shadow-lg shadow-[#FF7826]/20"
        >
          Join the Community
        </Link>

        <nav
          aria-label="Footer navigation"
          className="mt-12 flex max-w-4xl flex-wrap items-center justify-center gap-x-7 gap-y-4 text-sm font-medium text-zinc-400"
        >
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="w-full border-t border-zinc-800/80" />

      <div className="w-full py-6 text-center">
        <p className="text-zinc-500 text-[11px] md:text-xs font-medium tracking-wide">
          © 2026 Interdimensional Cafe. All rights reserved
        </p>
      </div>
    </footer>
  );
}
