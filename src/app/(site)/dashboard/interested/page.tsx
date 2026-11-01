import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { hasFeature, watchlistFor } from "@/server/workspace";
import { PageHeader } from "@/components/app/page-header";
import { WatchlistClient, type WatchRow } from "@/components/app/dashboard/watchlist-client";
import { PLAN_BY_ID, WATCHLIST_LIMIT } from "@/lib/plans";
import { lotValue } from "@/lib/search";

export const metadata: Metadata = { title: "Watchlist" };

export default async function WatchlistPage() {
  const user = await requireUser("/dashboard/interested");
  const watched = await watchlistFor(user.id);
  const limit = WATCHLIST_LIMIT[user.plan];
  const rows: WatchRow[] = watched.map((w) => ({
    auctionId: w.auctionId,
    savedAt: w.savedAt,
    auction: w.auction
      ? {
          id: w.auction.id,
          title: w.auction.title,
          city: w.auction.city,
          state: w.auction.state,
          source: w.auction.source,
          category: w.auction.category,
          startsAt: w.auction.startsAt,
          endsAt: w.auction.endsAt,
          emdPercent: w.auction.emdPercent,
          lots: w.auction.lots.length,
          value: lotValue(w.auction),
          isReauction: w.auction.isReauction,
        }
      : undefined,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Watchlist"
        title="Auctions you are tracking"
        description={
          Number.isFinite(limit)
            ? `${PLAN_BY_ID[user.plan].name} plan: up to ${limit} saved auctions.`
            : "Unlimited saved auctions on your plan."
        }
      />
      <WatchlistClient
        initial={rows}
        limit={Number.isFinite(limit) ? limit : null}
        canQuote={hasFeature(user, "quoteBuilder")}
        canShip={hasFeature(user, "logisticsQuotes")}
      />
    </>
  );
}
