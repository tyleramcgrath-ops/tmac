import type { MetadataRoute } from "next";
import { PUBLISHED, SITE, getPosts } from "@/lib/blog";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getPosts();
  return [
    { url: `${SITE}/`, lastModified: PUBLISHED, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE}/blog/`, lastModified: PUBLISHED, changeFrequency: "weekly", priority: 0.9 },
    ...posts.map((p) => ({
      url: `${SITE}/blog/${p.slug}/`,
      lastModified: p.date,
      changeFrequency: "monthly" as const,
      priority: 0.8,
      images: [`${SITE}/blog/${p.slug}.jpg`],
    })),
  ];
}
