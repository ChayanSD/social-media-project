import type { Metadata } from "next";
import SeoLandingPage from "../SeoLandingPage";
import { corePageMetadata, featureCards, siteUrl } from "../seoPageContent";

const page = corePageMetadata.features;

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: {
    canonical: `${siteUrl}/features`,
  },
};

export default function FeaturesPage() {
  return (
    <SeoLandingPage title={page.h1} description={page.description}>
      <div className="grid gap-5 md:grid-cols-2">
        {featureCards.map((feature) => (
          <article
            key={feature.title}
            className="rounded-[28px] border border-white/10 bg-white/[0.04] p-7 transition-colors hover:bg-white/[0.07]"
          >
            <h2 className="text-2xl font-semibold">{feature.title}</h2>
            <p className="mt-4 text-base leading-7 text-white/65">
              {feature.body}
            </p>
          </article>
        ))}
      </div>
    </SeoLandingPage>
  );
}
