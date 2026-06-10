import type { Metadata } from "next";
import SeoLandingPage from "../SeoLandingPage";
import { corePageMetadata, siteUrl } from "../seoPageContent";

const page = corePageMetadata.whyItMatters;

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: {
    canonical: `${siteUrl}/why-it-matters`,
  },
};

export default function WhyItMattersPage() {
  return (
    <SeoLandingPage title={page.h1} description={page.description}>
      <div className="grid gap-5 lg:grid-cols-3">
        {[
          {
            title: "Deep-Dive Discussion Spaces",
            body: "Explore dedicated forums on quantum science, consciousness, parallel universes, astrology and galactic topics: free from the noise of generic social media.",
          },
          {
            title: "Metaphysical Marketplace",
            body: "Offer or discover spiritual readings, consciousness coaching, astrology reports, metaphysical tools and digital courses: all within a trusted community.",
          },
          {
            title: "Moderated, Intentional Discussions",
            body: "Our moderation system ensures every discussion stays on-topic, respectful and relevant: so you can explore freely without trolls, spam or off-theme noise.",
          },
        ].map((reason) => (
          <article
            key={reason.title}
            className="rounded-[28px] border border-white/10 bg-white/[0.04] p-7"
          >
            <h2 className="text-2xl font-semibold">{reason.title}</h2>
            <p className="mt-4 text-base leading-7 text-white/65">
              {reason.body}
            </p>
          </article>
        ))}
      </div>
    </SeoLandingPage>
  );
}
