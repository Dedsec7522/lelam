import type { Metadata } from "next";
import { Suspense } from "react";
import { filtersFromSearchParams, runSearch } from "@/server/auction-query";
import { getCurrentUser } from "@/server/session";
import { canUse } from "@/lib/plans";
import { CATEGORY_BY_ID } from "@/lib/taxonomy";
import type { CategoryId } from "@/lib/types";
import { Marketplace } from "@/components/auctions/marketplace";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const cat = typeof sp.category === "string" ? CATEGORY_BY_ID[sp.category as CategoryId] : undefined;
  const title = cat ? `${cat.label} auctions: MSTC & bank e-auctions` : "Auction marketplace: MSTC e-auctions & bank properties";
  return {
    title,
    description: cat
      ? `Live and upcoming ${cat.label.toLowerCase()} auctions across India with lot-level valuation, EMD and landed-cost estimates.`
      : "Search every MSTC e-auction and bank property auction in India by material, location and distance, with valuation and landed cost.",
    alternates: { canonical: cat ? `/auctions?category=${cat.id}` : "/auctions" },
    // Faceted combinations beyond a single category are not worth indexing.
    robots: Object.keys(sp).some((k) => k !== "category") ? { index: false, follow: true } : undefined,
  };
}

export default async function AuctionsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const canReauction = !!user && canUse(user.plan, "reauctionFilter");
  const result = runSearch(filtersFromSearchParams(sp), { allowReauction: canReauction });

  return (
    <Suspense>
      <Marketplace initial={result} canReauction={canReauction} />
    </Suspense>
  );
}
