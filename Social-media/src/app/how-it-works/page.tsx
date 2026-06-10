import type { Metadata } from "next";
import SeoLandingPage from "../SeoLandingPage";
import {
  corePageMetadata,
  howItWorksSteps,
  siteUrl,
} from "../seoPageContent";

const page = corePageMetadata.howItWorks;

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: {
    canonical: `${siteUrl}/how-it-works`,
  },
};

export default function HowItWorksPage() {
  return (
    <SeoLandingPage title={page.h1} description={page.description}>
      <div className="grid gap-5 md:grid-cols-2">
        {howItWorksSteps.map((step, index) => (
          <article
            key={step.title}
            className="rounded-[28px] border border-white/10 bg-white/[0.04] p-7"
          >
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-[#FF7826]">
              Step {index + 1}
            </span>
            <h2 className="mt-4 text-2xl font-semibold">{step.title}</h2>
            <p className="mt-4 text-base leading-7 text-white/65">
              {step.body}
            </p>
          </article>
        ))}
      </div>
    </SeoLandingPage>
  );
}
