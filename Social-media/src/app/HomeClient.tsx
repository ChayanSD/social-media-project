"use client";

import Image from "next/image";
import { ArrowUpRight, Plus, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGetCurrentUserProfileQuery } from "@/store/authApi";
import { homepageFaqs } from "./homeFaqs";
import LandingFooter from "./LandingFooter";
import LandingHeader from "./LandingHeader";
import { MotionItem, MotionReveal, MotionStagger } from "./LandingMotion";

export default function HomeClient() {
  const router = useRouter();
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
    <div className="min-h-screen bg-[#000000] text-white font-sans flex flex-col justify-between overflow-x-clip selection:bg-[#F6339A] selection:text-white">
      <LandingHeader />

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-6 pt-12 pb-20 md:pt-16 md:pb-24 flex flex-col justify-center relative">
        <MotionReveal className="w-full relative">
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
        </MotionReveal>
      </main>

      <div
        id="how-it-works"
        className="w-full max-w-[1440px] mx-auto px-6 pb-12 md:pb-16 mt-auto scroll-mt-8"
      >
        <MotionStagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MotionItem className="flex flex-col justify-between h-[320px] p-8 rounded-[32px] bg-[#8B5CF6] text-white transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#8B5CF6]/30 group cursor-pointer">
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
          </MotionItem>

          <MotionItem className="flex flex-col justify-between h-[320px] p-8 rounded-[32px] bg-[#121212] border border-zinc-800/80 text-white transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-white/5 group cursor-pointer">
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
          </MotionItem>

          <MotionItem className="flex flex-col justify-between h-[320px] p-8 rounded-[32px] bg-[#F6339A] text-white transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#F6339A]/30 group cursor-pointer">
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
          </MotionItem>

          <MotionItem className="flex flex-col justify-between h-[320px] p-8 rounded-[32px] bg-[#FF7826] text-white transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#FF7826]/30 group cursor-pointer">
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
          </MotionItem>
        </MotionStagger>
      </div>

      <section
        id="why-it-matters"
        className="w-full max-w-[1440px] mx-auto px-6 py-14 md:py-20 lg:py-24 scroll-mt-8"
      >
        <MotionReveal>
          <h2 className="mx-auto max-w-[1160px] text-white text-4xl md:text-5xl lg:text-[64px] font-sans font-semibold text-center mb-8 md:mb-14 select-none">
            Why Seekers Choose Interdimensional Cafe
          </h2>
        </MotionReveal>

        <MotionStagger className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <MotionItem className="lg:col-span-6 min-h-[268px] bg-[#191919] rounded-[24px] p-6 md:p-8 flex flex-col sm:flex-row items-center sm:items-center gap-5 md:gap-8 border border-zinc-800/70 transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="relative w-full max-w-[210px] sm:w-[220px] md:w-[240px] aspect-square shrink-0">
              <Image
                src="/quantum-forums.svg"
                alt="Quantum forum orbital illustration"
                fill
                sizes="(max-width: 640px) 210px, 240px"
                className="object-contain"
              />
            </div>
            <div className="w-full text-center sm:text-left">
              <h3 className="text-white text-xl md:text-2xl lg:text-[28px] font-semibold mb-4 leading-tight">
                Deep-Dive Discussion Spaces
              </h3>
              <p className="text-zinc-300 text-sm md:text-[15px] leading-relaxed max-w-[310px] mx-auto sm:mx-0">
                Explore dedicated forums on quantum science, consciousness,
                parallel universes, astrology and galactic topics: free from
                the noise of generic social media.
              </p>
            </div>
          </MotionItem>

          <MotionItem className="lg:col-span-6 min-h-[268px] bg-[#FF7826] rounded-[24px] p-6 md:p-8 flex flex-col justify-between overflow-hidden transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl shadow-[#FF7826]/10">
            <div className="relative h-[142px] sm:h-[158px] md:h-[170px] -mx-1">
              <Image
                src="/metaphysical-marketplace.svg"
                alt="Metaphysical marketplace symbols"
                fill
                sizes="(max-width: 640px) 100vw, 560px"
                className="object-contain"
              />
            </div>
            <div className="relative z-10">
              <h3 className="text-white text-xl md:text-2xl lg:text-[28px] font-semibold mb-4 leading-tight">
                Metaphysical Marketplace
              </h3>
              <p className="text-white text-sm md:text-[15px] leading-relaxed max-w-[360px]">
                Offer or discover spiritual readings, consciousness coaching,
                astrology reports, metaphysical tools and digital courses: all
                within a trusted community.
              </p>
            </div>
          </MotionItem>

          <MotionItem className="lg:col-span-4 lg:col-start-1 p-1 sm:p-4 lg:py-8 lg:pr-8 flex items-center">
            <p className="text-zinc-300 text-sm md:text-[15px] leading-relaxed max-w-[440px] mx-auto lg:mx-0 text-center lg:text-left">
              Interdimensional Cafe is a quantum science and metaphysical
              community forum where curious minds explore consciousness,
              physics and spirituality together. Join moderated discussions,
              connect with like-minded seekers and discover resources that
              expand your understanding of reality.
            </p>
          </MotionItem>

          <MotionItem className="lg:col-span-8 bg-[#F6339A] rounded-[24px] p-6 md:p-8 flex flex-col sm:flex-row items-center gap-5 md:gap-9 min-h-[296px] transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl shadow-[#F6339A]/10">
            <div className="relative w-full max-w-[330px] sm:w-[360px] md:w-[430px] aspect-[1.55] shrink-0">
              <Image
                src="/moderated-discussions.svg"
                alt="Moderated discussion and safety illustration"
                fill
                sizes="(max-width: 640px) 330px, 430px"
                className="object-contain"
              />
            </div>
            <div className="w-full text-center sm:text-left">
              <h3 className="text-white text-xl md:text-2xl lg:text-[28px] font-semibold mb-4 leading-tight">
                Moderated, Intentional Discussions
              </h3>
              <p className="text-white/90 text-sm md:text-[15px] leading-relaxed max-w-[320px] mx-auto sm:mx-0">
                Our moderation system ensures every discussion stays on-topic,
                respectful and relevant: so you can explore freely without
                trolls, spam or off-theme noise.
              </p>
            </div>
          </MotionItem>
        </MotionStagger>
      </section>

      <section
        id="features"
        className="w-full max-w-[1440px] mx-auto px-6 pt-16 pb-8 md:pb-12 scroll-mt-8"
      >
        <MotionReveal>
          <h2 className="text-white text-4xl md:text-5xl lg:text-[64px] font-sans font-semibold text-center mb-16 select-none">
            Explore What Interdimensional Cafe Offers
          </h2>
        </MotionReveal>
        <MotionStagger className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MotionItem className="flex flex-col justify-center h-[320px] p-10 md:p-12 rounded-[32px] bg-[#8B5CF6] text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl shadow-[#8B5CF6]/20">
            <h3 className="text-3xl font-semibold tracking-tight mb-6">
              Quantum and Metaphysical Discussion Categories
            </h3>
            <p className="text-base leading-relaxed opacity-90 max-w-md">
              Browse and post in vetted categories spanning quantum science,
              neuroscience, consciousness, astrology, parallel universes, the
              zero point field and more.
            </p>
          </MotionItem>

          <MotionItem className="flex flex-col justify-center h-[320px] p-10 md:p-12 rounded-[32px] bg-[#161616] text-white border border-zinc-800/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <h3 className="text-3xl font-semibold tracking-tight mb-6">
              Live Discovery Feed
            </h3>
            <p className="text-base leading-relaxed text-zinc-400 max-w-md">
              Stay current with trending posts, new research insights, rising
              community discussions and fresh topics across all quantum science
              and metaphysical categories.
            </p>
          </MotionItem>

          <MotionItem className="flex flex-col justify-center h-[320px] p-10 md:p-12 rounded-[32px] bg-[#F6339A] text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl shadow-[#F6339A]/20">
            <h3 className="text-3xl font-semibold tracking-tight mb-6">
              Metaphysical Marketplace
            </h3>
            <p className="text-base leading-relaxed opacity-90 max-w-md">
              Connect with practitioners, coaches and creators offering
              spiritual readings, consciousness workshops, astrology reports and
              quantum healing resources.
            </p>
          </MotionItem>

          <MotionItem className="flex flex-col justify-center h-[320px] p-10 md:p-12 rounded-[32px] bg-[#FF7826] text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl shadow-[#FF7826]/20">
            <h3 className="text-3xl font-semibold tracking-tight mb-6">
              Private Member Messaging
            </h3>
            <p className="text-base leading-relaxed font-medium opacity-90 max-w-md">
              Take conversations deeper with private direct messages and group
              chats. Built-in safety tools include blocking, reporting and
              moderated content screening.
            </p>
          </MotionItem>
        </MotionStagger>
      </section>

      <section
        className="w-full max-w-[1440px] mx-auto px-6 pt-8 pb-16 md:pt-10 md:pb-24 scroll-mt-8"
        id="faqs"
      >
        <MotionReveal className="relative mx-auto mb-12 aspect-square w-full overflow-hidden rounded-[36px] border border-white/10 bg-[#080808] shadow-2xl shadow-[#F6339A]/10 md:mb-14 md:aspect-[3/1]">
          <Image
            src="/fullSizeBanner.webp"
            alt="Interdimensional Cafe community questions banner"
            width={1200}
            height={400}
            className="h-full w-full object-cover"
          />
        </MotionReveal>

        <MotionReveal className="mx-auto max-w-3xl">
          <h2 className="text-white text-4xl md:text-5xl lg:text-[56px] font-semibold text-center mb-12 leading-tight tracking-tight">
            Frequently Asked
            <br />
            Questions
          </h2>
          <div className="flex flex-col gap-3">
            {homepageFaqs.map((faq, index) => {
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
                    <span
                      className={`font-medium text-sm transition-colors md:text-base ${
                        isOpen ? "text-[#FF7826]" : "text-white"
                      }`}
                    >
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
        </MotionReveal>
      </section>

      <LandingFooter />
    </div>
  );
}
