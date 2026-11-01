import type { MetadataRoute } from "next";
import { catalog } from "@/server/catalog";
import { POSTS } from "@/content/blog";
import { CATEGORIES } from "@/lib/taxonomy";
import { statusOf } from "@/lib/search";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPages = ["/", "/auctions", "/pricing", "/about", "/contact", "/faq", "/blog", "/news", "/notices", "/quotes", "/terms", "/privacy", "/cookies"];
  const open = catalog()
    .list()
    .filter((a) => statusOf(a, now.getTime()) !== "closed");

  return [
    ...staticPages.map((p) => ({
      url: absoluteUrl(p),
      lastModified: now,
      changeFrequency: p === "/" || p === "/auctions" ? ("hourly" as const) : ("weekly" as const),
      priority: p === "/" ? 1 : p === "/auctions" ? 0.9 : 0.6,
    })),
    ...CATEGORIES.map((c) => ({ url: absoluteUrl(`/auctions?category=${c.id}`), lastModified: now, changeFrequency: "daily" as const, priority: 0.8 })),
    ...open.map((a) => ({ url: absoluteUrl(`/auctions/${a.id}`), lastModified: new Date(a.startsAt) < now ? now : new Date(a.inspectionFrom), changeFrequency: "daily" as const, priority: 0.7 })),
    ...POSTS.map((p) => ({ url: absoluteUrl(`/blog/${p.slug}`), lastModified: new Date(p.date), changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
