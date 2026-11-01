import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

// Pure function of config: static in every build (required for the GitHub Pages export).
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/dashboard", "/seller", "/logistics", "/admin", "/checkout", "/auth/"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
