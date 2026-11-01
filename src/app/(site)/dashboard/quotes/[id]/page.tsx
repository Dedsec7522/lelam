import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/session";
import { read } from "@/server/store";
import { auctionOptionsFor, auctionTitle, canTouch, hasFeature } from "@/server/workspace";
import { PageHeader } from "@/components/app/page-header";
import { UpgradePanel } from "@/components/app/upgrade-panel";
import { QuoteBuilder } from "@/components/app/dashboard/quote-builder";

export const metadata: Metadata = { title: "Edit quote" };

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/dashboard/quotes/${id}`);
  if (!hasFeature(user, "quoteBuilder")) {
    return (
      <>
        <PageHeader eyebrow="Quote Builder" title="Quote" />
        <UpgradePanel feature="quoteBuilder" />
      </>
    );
  }
  const quote = await read((db) => db.quotes.find((q) => q.id === id));
  if (!quote || !canTouch(user, quote)) notFound();
  const options = await auctionOptionsFor(user.id);

  return (
    <>
      <PageHeader eyebrow="Quote Builder" title={`Quote ${quote.number}`} description={`For ${quote.client}`} />
      <QuoteBuilder
        initial={{
          id: quote.id,
          number: quote.number,
          client: quote.client,
          auctionId: quote.auctionId,
          lines: quote.lines,
          gstRate: quote.gstRate,
          marginPct: quote.marginPct,
          terms: quote.terms,
          status: quote.status,
        }}
        options={options}
        auctionLabel={auctionTitle(quote.auctionId)}
      />
    </>
  );
}
