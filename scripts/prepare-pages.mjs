#!/usr/bin/env node
/**
 * Prepares a checkout for the static GitHub Pages export. DESTRUCTIVE: run it only in CI or on a
 * throwaway copy, never in your working tree.
 *
 *   node scripts/prepare-pages.mjs [projectRoot]
 *
 * - Removes API route handlers and the auth proxy (static hosting has no server).
 * - Replaces server-only areas (dashboards, portals, checkout, sign-in) with a "static demo" notice.
 * - Swaps the marketplace page for its browser-side version.
 */
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv.slice(2).find((a) => !a.startsWith("--")) ?? process.cwd());
const app = path.join(root, "src", "app");

if (process.env.CI !== "true" && !process.argv.includes("--yes")) {
  console.error("Refusing to run outside CI without --yes (this script deletes files).");
  process.exit(1);
}

const remove = (p) => {
  if (existsSync(p)) rmSync(p, { recursive: true, force: true });
};

remove(path.join(app, "api"));
remove(path.join(root, "src", "proxy.ts"));
// These tests exercise the API routes removed above; they run in the normal (server) pipeline.
remove(path.join(root, "tests", "integration"));

const notice = (feature) => `import type { Metadata } from "next";
import { DemoNotice } from "@/components/demo-notice";

export const metadata: Metadata = { title: ${JSON.stringify(feature)}, robots: { index: false } };

export default function Page() {
  return <DemoNotice feature=${JSON.stringify(feature)} />;
}
`;

const replaceWithNotice = (dir, feature) => {
  remove(dir);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "page.tsx"), notice(feature));
};

const site = path.join(app, "(site)");
replaceWithNotice(path.join(site, "dashboard"), "Your dashboard");
replaceWithNotice(path.join(site, "seller"), "The seller portal");
replaceWithNotice(path.join(site, "logistics"), "The logistics portal");
replaceWithNotice(path.join(site, "admin"), "The admin console");
replaceWithNotice(path.join(site, "checkout"), "Checkout");

// Static sub-routes that public pages link to, so no in-site link ever 404s on Pages.
const addNotice = (rel, feature) => {
  const dir = path.join(site, rel);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "page.tsx"), notice(feature));
};
for (const [rel, feature] of [
  ["dashboard/interested", "Your watchlist"],
  ["dashboard/bids", "Your bid log"],
  ["dashboard/reminders", "Reminders"],
  ["dashboard/documents", "The document vault"],
  ["dashboard/inventory", "Inventory"],
  ["dashboard/vendors", "Vendors"],
  ["dashboard/quotes", "The Quote Builder"],
  ["dashboard/quotes/new", "The Quote Builder"],
  ["dashboard/shipping-requests", "Transport quotes"],
  ["dashboard/notifications", "Notifications"],
  ["dashboard/profile", "Your profile"],
  ["seller/auctions", "The seller portal"],
  ["seller/auctions/create", "The seller portal"],
  ["logistics/requests", "The logistics portal"],
  ["logistics/profile", "The logistics portal"],
]) {
  addNotice(rel, feature);
}

// Auth pages sit outside the site chrome; render the notice inside the main layout instead (same URLs).
remove(path.join(app, "auth"));
for (const [route, feature] of [
  ["login", "Signing in"],
  ["register", "Creating an account"],
  ["forgot-password", "Password reset"],
  ["reset-password", "Password reset"],
]) {
  replaceWithNotice(path.join(site, "auth", route), feature);
}

writeFileSync(
  path.join(site, "auctions", "page.tsx"),
  `import type { Metadata } from "next";
import { Suspense } from "react";
import { StaticMarketplace } from "@/components/auctions/static-marketplace";
import { AuctionCardSkeleton } from "@/components/auctions/auction-card";

export const metadata: Metadata = {
  title: "Auction marketplace: MSTC e-auctions & bank properties",
  description: "Search MSTC e-auctions and bank property auctions by material, location and distance, with valuation and landed cost.",
};

export default function AuctionsPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page grid gap-5 py-16 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => (
            <AuctionCardSkeleton key={i} />
          ))}
        </div>
      }
    >
      <StaticMarketplace />
    </Suspense>
  );
}
`,
);

console.log("Prepared static Pages build in", root);
