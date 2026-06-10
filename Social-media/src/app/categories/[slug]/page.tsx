import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SeoLandingPage from "../../SeoLandingPage";
import { siteUrl } from "../../seoPageContent";
import {
  categoryLandingPages,
  getCategoryLandingPageBySlug,
} from "../categoryLandingPages";

interface CategoryLandingPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return categoryLandingPages.map((category) => ({
    slug: category.slug,
  }));
}

export async function generateMetadata({
  params,
}: CategoryLandingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryLandingPageBySlug(slug);

  if (!category) {
    return {};
  }

  const canonicalUrl = `${siteUrl}/categories/${category.slug}`;

  return {
    title: category.title,
    description: category.metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: category.title,
      description: category.metaDescription,
      type: "website",
      url: canonicalUrl,
    },
  };
}

export default async function CategoryLandingPage({
  params,
}: CategoryLandingPageProps) {
  const { slug } = await params;
  const category = getCategoryLandingPageBySlug(slug);

  if (!category) {
    notFound();
  }

  return (
    <SeoLandingPage title={category.title} description={category.metaDescription}>
      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#FF7826]">
          Category Landing Page
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-white">
          {category.name}
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-white/65">
          This public category page introduces the {category.name} discussion
          area for search engines and new visitors. Registered members can join
          Interdimensional Cafe to participate in relevant discussions and share
          resources.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/sign-up"
            className="rounded-lg bg-[#FF7826] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#FF7826]/90"
          >
            Join the Community
          </Link>
          <Link
            href="/categories"
            className="rounded-lg border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/75 transition-colors hover:bg-white/10 hover:text-white"
          >
            View All Categories
          </Link>
        </div>
      </div>
    </SeoLandingPage>
  );
}
