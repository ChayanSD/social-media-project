import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import LandingFooter from "../../LandingFooter";
import LandingHeader from "../../LandingHeader";
import { siteUrl } from "../../seoPageContent";
import {
  formatBlogDate,
  getBlogPostBySlug,
  getPublishedBlogPosts,
} from "../blogPosts";

interface BlogArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return getPublishedBlogPosts().map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return {};
  }

  const canonicalUrl = `${siteUrl}/blog/${post.slug}`;

  return {
    title: `${post.title} - Interdimensional Cafe`,
    description: post.metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      type: "article",
      url: canonicalUrl,
      publishedTime: post.publishedAt,
    },
  };
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const canonicalUrl = `${siteUrl}/blog/${post.slug}`;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription,
    url: canonicalUrl,
    publisher: {
      "@type": "Organization",
      name: "Interdimensional Cafe",
    },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${siteUrl}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white font-sans flex flex-col justify-between overflow-x-clip selection:bg-[#F6339A] selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <LandingHeader />
      <main className="w-full max-w-[980px] mx-auto px-6 py-16 md:py-24">
        <nav className="mb-8 text-sm text-white/50" aria-label="Breadcrumb">
          <Link href="/" className="transition-colors hover:text-white">
            Home
          </Link>
          <span className="mx-2">&gt;</span>
          <Link href="/blog" className="transition-colors hover:text-white">
            Blog
          </Link>
          <span className="mx-2">&gt;</span>
          <span className="text-white/75">{post.title}</span>
        </nav>

        <article>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#FF7826]">
            {formatBlogDate(post.publishedAt)}
          </p>
          <h1 className="mt-4 text-white text-4xl md:text-5xl lg:text-[64px] font-sans font-semibold leading-tight tracking-tight select-none">
            {post.title}
          </h1>
          <div
            className="mt-10 space-y-6 text-base leading-8 text-zinc-300 [&_a]:text-[#FF7826] [&_h2]:pt-6 [&_h2]:text-3xl [&_h2]:font-semibold [&_h3]:pt-4 [&_h3]:text-2xl [&_h3]:font-semibold [&_li]:ml-6 [&_li]:list-disc [&_p]:leading-8 [&_strong]:text-white"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />
        </article>

        <div className="mt-12 border-t border-white/10 pt-8">
          <Link
            href="/blog"
            className="inline-flex rounded-lg border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/75 transition-colors hover:bg-white/10 hover:text-white"
          >
            Back to Blog
          </Link>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
