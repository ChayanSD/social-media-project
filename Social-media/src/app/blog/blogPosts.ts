export interface BlogPost {
  title: string;
  slug: string;
  metaDescription: string;
  publishedAt: string;
  contentHtml: string;
  status: "draft" | "published";
}

export const blogPosts: BlogPost[] = [];

export const blogPostTemplate = {
  title: "[ARTICLE TITLE]",
  slug: "[article-slug]",
  metaDescription: "[ARTICLE META DESCRIPTION]",
  publishedAt: "2026-01-01",
  contentHtml: `
    <p><!-- Article content goes here --></p>
  `,
  status: "draft",
} as const satisfies BlogPost;

export function getPublishedBlogPosts() {
  return [...blogPosts]
    .filter((post) => post.status === "published")
    .sort(
      (first, second) =>
        new Date(second.publishedAt).getTime() -
        new Date(first.publishedAt).getTime()
    );
}

export function getBlogPostBySlug(slug: string) {
  return getPublishedBlogPosts().find((post) => post.slug === slug) ?? null;
}

export function getBlogExcerpt(post: BlogPost, length = 150) {
  const text = post.contentHtml
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) {
    return post.metaDescription.slice(0, length);
  }

  return text.length > length ? `${text.slice(0, length).trim()}...` : text;
}

export function formatBlogDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}
