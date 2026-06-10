import type { Metadata } from "next";
import SeoLandingPage from "../SeoLandingPage";
import { homepageFaqs } from "../homeFaqs";
import { corePageMetadata, siteUrl } from "../seoPageContent";

const page = corePageMetadata.faqs;
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: homepageFaqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: {
    canonical: `${siteUrl}/faqs`,
  },
};

export default function FaqsPage() {
  return (
    <SeoLandingPage title={page.h1} description={page.description}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="space-y-4">
        {homepageFaqs.map((faq) => (
          <article
            key={faq.question}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"
          >
            <h2 className="text-xl font-semibold">{faq.question}</h2>
            <p className="mt-3 text-base leading-7 text-white/65">
              {faq.answer}
            </p>
          </article>
        ))}
      </div>
    </SeoLandingPage>
  );
}
