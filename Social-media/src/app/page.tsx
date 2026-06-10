import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import { homepageFaqs } from "./homeFaqs";

const title =
  "Interdimensional Cafe: Quantum Science, Consciousness and Spirituality Forum";
const description =
  "Join the Interdimensional Cafe community forum for discussions on quantum science, consciousness, metaphysics, astrology, parallel universes, spiritual awakening and more. Free to join.";
const url = "https://interdimensionalcafe.com/";
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
  title,
  description,
  keywords: [
    "quantum science forum",
    "consciousness community",
    "metaphysics discussion",
    "spiritual awakening forum",
    "astrology community",
    "parallel universes",
    "holographic universe",
    "neuroscience forum",
    "zero point field",
    "extraterrestrial discussions",
  ],
  alternates: {
    canonical: url,
  },
  openGraph: {
    title,
    description:
      "Explore the frontiers of quantum science, consciousness and metaphysics with a global community of seekers and researchers.",
    type: "website",
    url,
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <HomeClient />
    </>
  );
}
