import LandingFooter from "./LandingFooter";
import LandingHeader from "./LandingHeader";
import { MotionReveal } from "./LandingMotion";

interface SeoLandingPageProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export default function SeoLandingPage({
  title,
  description,
  children,
}: SeoLandingPageProps) {
  return (
    <div className="min-h-screen bg-[#000000] text-white font-sans flex flex-col justify-between overflow-x-clip selection:bg-[#F6339A] selection:text-white">
      <LandingHeader />
      <main className="w-full max-w-[1440px] mx-auto px-6 py-16 md:py-24">
        <MotionReveal className="mb-12 max-w-4xl" revealOnView={false}>
          <h1 className="text-white text-4xl md:text-5xl lg:text-[64px] font-sans font-semibold leading-tight tracking-tight select-none">
            {title}
          </h1>
          <p className="mt-6 max-w-3xl text-base md:text-[20px] leading-relaxed text-zinc-300">
            {description}
          </p>
        </MotionReveal>

        <MotionReveal className="seo-static-page-content" revealOnView={false}>
          {children}
        </MotionReveal>
      </main>
      <LandingFooter />
    </div>
  );
}
