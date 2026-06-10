import type { Metadata } from "next";
import Link from "next/link";
import SeoLandingPage from "../SeoLandingPage";
import { corePageMetadata, siteUrl } from "../seoPageContent";
import {
  formatBlogDate,
  getBlogExcerpt,
  getPublishedBlogPosts,
} from "./blogPosts";

const page = corePageMetadata.blog;

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: {
    canonical: `${siteUrl}/blog`,
  },
};

export default function BlogIndexPage() {
  const posts = getPublishedBlogPosts();

  return (
    <SeoLandingPage title={page.h1} description={page.description}>
      {posts.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="rounded-[28px] border border-white/10 bg-white/[0.04] p-7 transition-colors hover:bg-white/[0.07]"
            >
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#FF7826]">
                {formatBlogDate(post.publishedAt)}
              </p>
              <h2 className="mt-4 text-2xl font-semibold text-white">
                {post.title}
              </h2>
              <p className="mt-4 text-base leading-7 text-white/65">
                {getBlogExcerpt(post)}
              </p>
              <Link
                href={`/blog/${post.slug}`}
                className="mt-6 inline-flex rounded-lg bg-[#FF7826] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#FF7826]/90"
              >
                Read More
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-8 text-center">
          <h2 className="text-2xl font-semibold text-white">
            Articles are coming soon
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/65">
            RC will publish articles from the source-code blog template after
            handover. Published articles will automatically appear here.
          </p>
        </div>
      )}
    </SeoLandingPage>
  );
}
