import type { MetadataRoute } from "next";
import { getPublishedBlogPosts } from "./blog/blogPosts";
import { categoryLandingPages } from "./categories/categoryLandingPages";
import { siteUrl } from "./seoPageContent";

const staticRoutes = [
  "",
  "/features",
  "/how-it-works",
  "/why-it-matters",
  "/faqs",
  "/privacy-policy",
  "/contact",
  "/blog",
  "/categories",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticEntries = staticRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
  }));
  const blogEntries = getPublishedBlogPosts().map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
  }));
  const categoryEntries = categoryLandingPages.map((category) => ({
    url: `${siteUrl}/categories/${category.slug}`,
    lastModified: now,
  }));

  return [...staticEntries, ...categoryEntries, ...blogEntries];
}
