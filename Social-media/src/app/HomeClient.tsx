"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Menu, Plus, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGetCurrentUserProfileQuery } from "@/store/authApi";

const faqs = [
  {
    question: "What is this platform for?",
    answer:
      "Interdimensional Cafe is a community forum for consciousness, quantum physics, metaphysics and spiritual exploration.",
  },
  {
    question: "Can users create their own communities?",
    answer:
      "Yes, users can create and manage their own public, restricted, or private communities.",
  },
  {
    question: "What can users post?",
    answer:
      "Users can share posts, media, discussions, links, reviews, and trending content.",
  },
  {
    question: "Is content moderated?",
    answer:
      "Yes, we use AI-assisted moderation and community controls to help create healthier discussions.",
  },
  {
    question: "Is there a free plan?",
    answer:
      "Yes. Users can access the platform for free with limited marketplace posting options.",
  },
  {
    question: "How does the marketplace work?",
    answer:
      "List services and discover offerings through a community-powered marketplace with categories and profiles.",
  },
  {
    question: "Can users message each other?",
    answer:
      "Yes, you can move conversations into direct messages and group chats.",
  },
];

export default function HomeClient() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(4);

  const {
    data: profileResponse,
    isLoading,
    isError,
  } = useGetCurrentUserProfileQuery();

  const isAuthenticated = !isLoading && !isError && !!profileResponse?.data;

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/explore");
    }
  }, [isAuthenticated, router]);

  // Show nothing while checking auth or redirecting
  if (isLoading || isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white font-sans flex flex-col justify-between overflow-x-hidden selection:bg-[#F6339A] selection:text-white">
      <header className="w-full max-w-[1440px] mx-auto px-6 py-6 md:py-8 flex items-center justify-between relative z-50">
        <div className="flex items-center gap-3 shrink-0">
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
        </div>

        <div className="hidden md:flex items-center flex-1">
          <div className="flex-1 h-[1px] bg-zinc-800/80 mx-8" />

          <nav className="flex items-center gap-8 shrink-0 text-sm font-medium text-zinc-400">
            <Link
              href="#how-it-works"
              className="hover:text-white transition-colors duration-200"
            >
              How It Works
            </Link>
            <Link
              href="#features"
              className="hover:text-white transition-colors duration-200"
            >
              Features
            </Link>
            <Link
              href="#why-it-matters"
              className="hover:text-white transition-colors duration-200"
            >
              Why It Matters
            </Link>
            <Link
              href="#faqs"
              className="hover:text-white transition-colors duration-200"
            >
              FAQs
            </Link>
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
          <nav className="flex flex-col gap-6 text-2xl font-medium text-zinc-400">
            <Link
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white transition-colors py-2 border-b border-zinc-900"
            >
              How It Works
            </Link>
            <Link
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white transition-colors py-2 border-b border-zinc-900"
            >
              Features
            </Link>
            <Link
              href="#why-it-matters"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white transition-colors py-2 border-b border-zinc-900"
            >
              Why It Matters
            </Link>
            <Link
              href="#faqs"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white transition-colors py-2 border-b border-zinc-900"
            >
              FAQs
            </Link>
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

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-6 pt-12 pb-20 md:pt-16 md:pb-24 flex flex-col justify-center relative">
        <div className="w-full relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start">
            <div className="lg:col-span-8 relative">
              <div className="absolute -bottom-36 sm:-bottom-44 left-4 md:left-[10%] transform -rotate-[2deg] bg-[#F6339A] text-white text-xs md:text-sm font-semibold px-4 py-2 rounded-lg shadow-xl shadow-[#F6339A]/20 z-20 select-none animate-bounce-slow">
                Moderated Community
              </div>

              <h1 className="text-white text-4xl sm:text-6xl md:text-8xl lg:text-[120px] font-sans font-semibold leading-[1.05] tracking-tight text-left select-none">
                <span className="inline-flex items-center mr-3 md:mr-5 align-middle">
                  <span className="w-8 sm:w-16 h-[2px] bg-white relative shrink-0">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white" />
                  </span>

                  <span className="flex items-center -space-x-3 md:-space-x-4 shrink-0">
                    <div className="w-10 h-10 sm:w-16 sm:h-16 md:w-[72px] md:h-[72px] rounded-full border-2 border-white overflow-hidden bg-zinc-800 shrink-0 relative transition-transform duration-300 hover:scale-110 z-30 hover:z-40">
                      <Image
                        src="/avatar.jpg"
                        alt="User Avatar"
                        width={72}
                        height={72}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="w-10 h-10 sm:w-16 sm:h-16 md:w-[72px] md:h-[72px] rounded-full border-2 border-white bg-[#8B5CF6] shrink-0 relative transition-transform duration-300 hover:scale-110 z-20 hover:z-40" />
                    <div className="w-10 h-10 sm:w-16 sm:h-16 md:w-[72px] md:h-[72px] rounded-full border-2 border-white bg-[#F6339A] shrink-0 relative transition-transform duration-300 hover:scale-110 z-10 hover:z-40" />
                  </span>
                  <span className="w-8 sm:w-16 md:w-20 lg:w-24 h-[2px] bg-white shrink-0" />
                </span>
                Where Quantum Science
                <span className="block sm:hidden text-white text-4xl sm:text-6xl md:text-8xl lg:text-[120px] font-sans font-semibold leading-[1.05] tracking-tight mt-2 text-left select-none">
                  Meets Spiritual Awakening
                </span>
              </h1>
            </div>

            <div className="lg:col-span-4 text-left relative pb-4 md:pb-6 sm:pt-6">
              <div className="absolute -top-56 sm:-top-6 -right-0 sm:-left-10 w-fit transform rotate-[10deg] bg-[#8B5CF6] text-white text-xs md:text-sm font-semibold px-4 py-2 rounded-lg shadow-xl shadow-[#8B5CF6]/20 z-20 select-none animate-bounce-slow">
                Explore the Beyond
              </div>

              <p className="text-zinc-300 text-base md:text-[20px] leading-relaxed max-w-sm font-normal font-sans">
                A community forum for consciousness, quantum physics,
                metaphysics and spiritual exploration. Join researchers,
                seekers and explorers sharing knowledge from around the world.
              </p>
            </div>
          </div>

          <h1 className="hidden sm:block text-white text-4xl sm:text-6xl md:text-8xl lg:text-[120px] font-sans font-semibold leading-[1.05] tracking-tight mt-2 text-left select-none">
            Meets Spiritual Awakening
          </h1>
        </div>
      </main>

      <div
        id="how-it-works"
        className="w-full mt-10 max-w-[1440px] mx-auto px-6 pb-12 md:pb-16 mt-auto scroll-mt-8"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex flex-col justify-between h-[320px] p-8 rounded-[32px] bg-[#8B5CF6] text-white transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#8B5CF6]/30 group cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium tracking-wide uppercase opacity-90">
                Active Communities
              </span>
              <ArrowUpRight
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                size={20}
              />
            </div>
            <span className="text-[64px] font-semibold tracking-tight leading-none my-auto">
              12K+
            </span>
            <p className="text-sm md:text-base leading-snug opacity-90">
              Discussion spaces covering quantum physics, consciousness
              studies, astrology and spiritual awakening topics.
            </p>
          </div>

          <div className="flex flex-col justify-between h-[320px] p-8 rounded-[32px] bg-[#121212] border border-zinc-800/80 text-white transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-white/5 group cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium tracking-wide uppercase text-zinc-400 group-hover:text-zinc-200 transition-colors">
                Monthly Discussions
              </span>
              <ArrowUpRight
                className="opacity-0 group-hover:opacity-100 text-zinc-400 transition-opacity duration-300"
                size={20}
              />
            </div>
            <span className="text-[64px] font-semibold tracking-tight leading-none my-auto text-white">
              3.1M
            </span>
            <p className="text-sm md:text-base leading-snug text-zinc-400 group-hover:text-zinc-300 transition-colors">
              In-depth exchanges on quantum mechanics, metaphysical concepts
              and spiritual development every month.
            </p>
          </div>

          <div className="flex flex-col justify-between h-[320px] p-8 rounded-[32px] bg-[#F6339A] text-white transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#F6339A]/30 group cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium tracking-wide uppercase opacity-90">
                Marketplace Listings
              </span>
              <ArrowUpRight
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                size={20}
              />
            </div>
            <span className="text-[64px] font-semibold tracking-tight leading-none my-auto">
              85K+
            </span>
            <p className="text-sm md:text-base leading-snug opacity-90">
              Spiritual readings, astrology reports, consciousness courses and
              metaphysical resources shared by verified members.
            </p>
          </div>

          <div className="flex flex-col justify-between h-[320px] p-8 rounded-[32px] bg-[#FF7826] text-white transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#FF7826]/30 group cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold tracking-wide uppercase opacity-90">
                Private Conversations
              </span>
              <ArrowUpRight
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                size={20}
              />
            </div>
            <span className="text-[64px] font-semibold tracking-tight leading-none my-auto">
              4.2M
            </span>
            <p className="text-sm md:text-base leading-snug font-medium opacity-90">
              Private connections between spiritual seekers, quantum
              researchers and metaphysical practitioners.
            </p>
          </div>
        </div>
      </div>

      <section
        id="why-it-matters"
        className="w-full max-w-[1160px] mx-auto px-6 py-14 md:py-20 lg:py-24 scroll-mt-8"
      >
        <h2 className="text-white text-4xl md:text-5xl lg:text-[64px] font-sans font-semibold text-center mb-8 md:mb-14 select-none">
          Why People Use It
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-6 min-h-[268px] bg-[#191919] rounded-[24px] p-6 md:p-8 flex flex-col sm:flex-row items-center sm:items-center gap-5 md:gap-8 border border-zinc-800/70 transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="relative w-full max-w-[210px] sm:w-[220px] md:w-[240px] aspect-square shrink-0">
              <Image
                src="/Skill.png"
                alt="Skill illustration"
                fill
                sizes="(max-width: 640px) 210px, 240px"
                className="object-contain"
              />
            </div>
            <div className="w-full text-center sm:text-left">
              <h3 className="text-white text-xl md:text-2xl font-semibold mb-4 leading-tight">
                Focused Communities
              </h3>
              <p className="text-zinc-300 text-sm md:text-[15px] leading-relaxed max-w-[310px] mx-auto sm:mx-0">
                Join public, restricted, or private spaces designed around
                meaningful interests instead of noisy global feeds.
              </p>
            </div>
          </div>

          <div className="lg:col-span-4 min-h-[268px] bg-[#FF7826] rounded-[24px] p-6 md:p-8 flex flex-col justify-between overflow-hidden transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl shadow-[#FF7826]/10">
            <div className="relative h-[142px] sm:h-[158px] md:h-[170px] -mx-1">
              <Image
                src="/Request.png"
                alt="Request lettering"
                width={86}
                height={118}
                className="absolute left-1 top-1 w-[72px] sm:w-[82px] md:w-[90px] h-auto object-contain"
              />
              <Image
                src="/ring.png"
                alt="Marketplace service bell"
                width={172}
                height={116}
                className="absolute left-1/2 top-8 w-[138px] sm:w-[160px] md:w-[178px] -translate-x-1/2 object-contain"
              />
              <Image
                src="/hand.png"
                alt="Pointing hand"
                width={126}
                height={96}
                className="absolute -right-10 -top-12 w-[92px] sm:w-[108px] md:w-[124px] object-contain"
              />
            </div>
            <div className="relative z-10">
              <h3 className="text-white text-xl md:text-2xl font-semibold mb-4 leading-tight">
                Community Marketplace
              </h3>
              <p className="text-white text-sm md:text-[15px] leading-relaxed max-w-[360px]">
                Promote services, coaching, digital products, or external
                platforms directly to your audience.
              </p>
            </div>
          </div>

          <div className="lg:col-span-4 lg:col-start-1 p-1 sm:p-4 lg:py-8 lg:pr-8 flex items-center">
            <p className="text-zinc-300 text-sm md:text-[15px] leading-relaxed max-w-[440px] mx-auto lg:mx-0 text-center lg:text-left">
              Interdimensional Cafe is a community forum for consciousness,
              quantum physics, metaphysics and spiritual exploration. Join
              researchers, seekers and explorers sharing knowledge from around
              the world.
            </p>
          </div>

          <div className="lg:col-span-8 bg-[#F6339A] rounded-[24px] p-6 md:p-8 flex flex-col sm:flex-row items-center gap-5 md:gap-9 min-h-[296px] transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl shadow-[#F6339A]/10">
            <div className="relative w-full max-w-[330px] sm:w-[360px] md:w-[430px] aspect-[1.55] shrink-0">
              <Image
                src="/Love Herd.png"
                alt="Safer conversations illustration"
                fill
                sizes="(max-width: 640px) 330px, 430px"
                className="object-contain"
              />
            </div>
            <div className="w-full text-center sm:text-left">
              <h3 className="text-white text-xl md:text-2xl font-semibold mb-4 leading-tight">
                Safer Conversations
              </h3>
              <p className="text-white/90 text-sm md:text-[15px] leading-relaxed max-w-[320px] mx-auto sm:mx-0">
                AI-assisted moderation and community controls help create
                healthier discussions and more intentional interactions.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="w-full max-w-[1440px] mx-auto px-6 py-16 md:pb-32 scroll-mt-8"
      >
        <h2 className="text-white text-4xl md:text-5xl lg:text-[64px] font-sans font-semibold text-center mb-16 select-none">
          Platform Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col justify-center h-[320px] p-10 md:p-12 rounded-[32px] bg-[#8B5CF6] text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl shadow-[#8B5CF6]/20">
            <h3 className="text-3xl font-semibold tracking-tight mb-6">
              Communities
            </h3>
            <p className="text-base leading-relaxed opacity-90 max-w-md">
              Create and manage communities with custom rules, member roles,
              approvals, and moderation controls.
            </p>
          </div>

          <div className="flex flex-col justify-center h-[320px] p-10 md:p-12 rounded-[32px] bg-[#161616] text-white border border-zinc-800/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <h3 className="text-3xl font-semibold tracking-tight mb-6">
              Social Feed
            </h3>
            <p className="text-base leading-relaxed text-zinc-400 max-w-md">
              Share posts, media, discussions, links, reviews, and trending
              content through personalized feeds.
            </p>
          </div>

          <div className="flex flex-col justify-center h-[320px] p-10 md:p-12 rounded-[32px] bg-[#F6339A] text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl shadow-[#F6339A]/20">
            <h3 className="text-3xl font-semibold tracking-tight mb-6">
              Marketplace
            </h3>
            <p className="text-base leading-relaxed opacity-90 max-w-md">
              List services and discover offerings through a community-powered
              marketplace with categories and profiles.
            </p>
          </div>

          <div className="flex flex-col justify-center h-[320px] p-10 md:p-12 rounded-[32px] bg-[#FF7826] text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl shadow-[#FF7826]/20">
            <h3 className="text-3xl font-semibold tracking-tight mb-6">
              Messaging
            </h3>
            <p className="text-base leading-relaxed font-medium opacity-90 max-w-md">
              Move conversations into direct messages and group chats with
              reactions, requests, blocking, and reporting.
            </p>
          </div>
        </div>
      </section>

      <section
        className="w-full max-w-3xl mx-auto px-6 py-16 md:py-24 scroll-mt-8"
        id="faqs"
      >
        <h2 className="text-white text-4xl md:text-5xl lg:text-[56px] font-semibold text-center mb-12 leading-tight tracking-tight">
          Frequently Asked
          <br />
          Questions
        </h2>
        <div className="flex flex-col gap-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;

            return (
              <div
                key={faq.question}
                className="bg-[#161616] rounded-xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-5 md:p-6 text-left focus:outline-none"
                  type="button"
                >
                  <span className="text-white font-medium text-sm md:text-base">
                    {faq.question}
                  </span>
                  <span className="text-zinc-400 shrink-0 ml-4">
                    {isOpen ? <X size={18} /> : <Plus size={18} />}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-6 md:px-6 md:pb-6">
                    <p className="text-zinc-500 text-xs md:text-sm leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

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
        </div>

        <div className="w-full border-t border-zinc-800/80" />

        <div className="w-full py-6 text-center">
          <p className="text-zinc-500 text-[11px] md:text-xs font-medium tracking-wide">
            © 2026 Inter Dimensional Cafe. All rights reserved
          </p>
        </div>
      </footer>
    </div>
  );
}
