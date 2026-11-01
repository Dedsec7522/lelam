import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

// GitHub Pages build (see scripts/prepare-pages.mjs and .github/workflows/pages.yml).
const STATIC_EXPORT = process.env.STATIC_EXPORT === "1";
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Static hosting can't send headers or redirects, so they belong to the Node server build only.
const serverOnly: Pick<NextConfig, "headers" | "redirects"> = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      { source: "/login", destination: "/auth/login", permanent: true },
      { source: "/register", destination: "/auth/register", permanent: true },
      { source: "/auth", destination: "/auth/login", permanent: false },
      { source: "/adminlogin", destination: "/auth/login?redirect=/admin", permanent: false },
      { source: "/quote", destination: "/quotes", permanent: true },
      { source: "/dashboard/quote", destination: "/dashboard/quotes", permanent: true },
    ];
  },
};

const nextConfig: NextConfig = {
  ...(STATIC_EXPORT ? { output: "export" as const, basePath: BASE_PATH, trailingSlash: true, images: { unoptimized: true } } : serverOnly),
  poweredByHeader: false,
  turbopack: {
    // Pin the workspace root (a stray lockfile higher up the tree otherwise confuses inference).
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
