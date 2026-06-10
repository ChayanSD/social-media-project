import type { Metadata } from "next";
import Link from "next/link";
import SeoLandingPage from "../SeoLandingPage";
import { siteUrl } from "../seoPageContent";
import { categoryLandingPages } from "./categoryLandingPages";

export const metadata: Metadata = {
  title:
    "Discussion Categories: Quantum Science, Consciousness and Metaphysics Forums",
  description:
    "Explore Interdimensional Cafe discussion categories covering quantum science, neuroscience, consciousness, astrology, spiritual awakening, parallel universes and metaphysics.",
  alternates: {
    canonical: `${siteUrl}/categories`,
  },
};

export default function CategoriesLandingIndexPage() {
  return (
    <SeoLandingPage
      title="Explore Quantum Science and Metaphysical Discussion Categories"
      description="Browse the initial public category landing pages for Interdimensional Cafe. Each category is built for focused, indexable discussions across science, consciousness and spiritual exploration."
    >
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {categoryLandingPages.map((category) => (
          <Link
            key={category.slug}
            href={`/categories/${category.slug}`}
            className="rounded-[28px] border border-white/10 bg-white/[0.04] p-7 transition-colors hover:bg-white/[0.07]"
          >
            <h2 className="text-2xl font-semibold text-white">
              {category.name}
            </h2>
            <p className="mt-4 text-base leading-7 text-white/65">
              {category.metaDescription}
            </p>
          </Link>
        ))}
      </div>
    </SeoLandingPage>
  );
}
