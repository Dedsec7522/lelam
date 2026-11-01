import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { catalog } from "@/server/catalog";
import { auctionOptionsFor, hasFeature } from "@/server/workspace";
import { PageHeader } from "@/components/app/page-header";
import { UpgradePanel } from "@/components/app/upgrade-panel";
import { QuoteBuilder, type QuoteDraft } from "@/components/app/dashboard/quote-builder";

export const metadata: Metadata = { title: "New quote" };

const DEFAULT_TERMS =
  "Prices are ex-yard. Payment: 50% advance, balance before lifting. Loading and transport at buyer's cost unless stated. Quote valid for 7 days.";

export default async function NewQuotePage({ searchParams }: { searchParams: Promise<{ auction?: string }> }) {
  const user = await requireUser("/dashboard/quotes/new");
  if (!hasFeature(user, "quoteBuilder")) {
    return (
      <>
        <PageHeader eyebrow="Quote Builder" title="New quote" />
        <UpgradePanel feature="quoteBuilder" />
      </>
    );
  }
  const { auction: auctionId } = await searchParams;
  const auction = auctionId ? catalog().get(auctionId) : undefined;
  const options = await auctionOptionsFor(user.id);

  const draft: QuoteDraft = {
    client: "",
    auctionId: auction?.id,
    lines: auction
      ? auction.lots.slice(0, 60).map((l) => ({ description: `Lot ${l.lotNo}: ${l.description}`, quantity: l.quantity, unit: l.unit, rate: l.marketPrice }))
      : [],
    gstRate: auction?.gstRate ?? 18,
    marginPct: 12,
    terms: DEFAULT_TERMS,
    status: "draft",
  };

  return (
    <>
      <PageHeader
        eyebrow="Quote Builder"
        title="New quote"
        description={
          auction
            ? `Prefilled with ${auction.lots.length} lots from ${auction.title}, ${auction.city} at indicative market rates. Adjust to your cost.`
            : auctionId
              ? "We could not find that auction, so you are starting from a blank quote."
              : "Add line items, choose GST and your margin. Totals update as you type."
        }
      />
      <QuoteBuilder initial={draft} options={options} auctionLabel={auction ? `${auction.title}, ${auction.city}` : undefined} />
    </>
  );
}
