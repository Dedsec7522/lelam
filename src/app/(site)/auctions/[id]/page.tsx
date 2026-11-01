import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, FileText, Info } from "lucide-react";
import { catalog } from "@/server/catalog";
import { serverNow } from "@/server/clock";
import { projectAuction } from "@/lib/costing";
import { lotValue, statusOf } from "@/lib/search";
import { CATEGORY_BY_ID } from "@/lib/taxonomy";
import { formatINR } from "@/lib/format";
import { absoluteUrl } from "@/lib/site";
import { AuctionDetail } from "@/components/auctions/auction-detail";
import { AuctionCard } from "@/components/auctions/auction-card";
import { WatchlistProvider } from "@/components/auctions/watch-button";
import { LotArt } from "@/components/auctions/lot-art";
import { JsonLd } from "@/components/seo/json-ld";

type Props = { params: Promise<{ id: string }> };

// Static (GitHub Pages) export pre-renders every lot; the server build renders on demand.
export function generateStaticParams() {
  return process.env.STATIC_EXPORT === "1" ? catalog().list().map((a) => ({ id: a.id })) : [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const a = catalog().get(id);
  if (!a) return { title: "Auction not found", robots: { index: false } };
  const title = `${a.title}: ${a.source} auction in ${a.city}, ${a.state} (#${a.id})`;
  const description = `${CATEGORY_BY_ID[a.category].label} auction by ${a.seller}. ${a.lots.length} lots, indicative value ${formatINR(lotValue(a), { compact: true })}. EMD ${a.emdPercent}%. See landed cost and ROI on Lelam.`;
  return { title, description, alternates: { canonical: `/auctions/${a.id}` }, openGraph: { title, description, type: "article" } };
}

export default async function AuctionPage({ params }: Props) {
  const { id } = await params;
  const auction = catalog().get(id);
  if (!auction) notFound();
  const p = projectAuction(auction);
  const projection = { turnover: p.turnover, predictedClose: p.predictedClose, profit: p.profit, roiPercent: p.roiPercent };
  const now = serverNow();
  const related = catalog()
    .list()
    .filter((a) => a.id !== auction.id && a.category === auction.category && statusOf(a, now) !== "closed")
    .slice(0, 3);
  const cat = CATEGORY_BY_ID[auction.category];

  return (
    <WatchlistProvider>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Event",
          name: auction.title,
          description: auction.description,
          startDate: auction.startsAt,
          endDate: auction.endsAt,
          eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
          eventStatus: "https://schema.org/EventScheduled",
          location: { "@type": "VirtualLocation", url: absoluteUrl(`/auctions/${auction.id}`) },
          organizer: { "@type": "Organization", name: auction.seller },
        }}
      />
      <div className="container-page pb-8 pt-6">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[0.82rem] text-muted">
          <Link href="/auctions" className="hover:text-ink">
            Auctions
          </Link>
          <ChevronRight className="size-3.5" aria-hidden />
          <Link href={`/auctions?category=${cat.id}`} className="hover:text-ink">
            {cat.label}
          </Link>
          <ChevronRight className="size-3.5" aria-hidden />
          <span aria-current="page" className="text-ink-2">
            #{auction.id}
          </span>
        </nav>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_340px]">
          <AuctionDetail auction={auction} projection={projection} />

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-3xl border border-line bg-surface">
              <LotArt category={auction.category} seed={auction.id} className="h-40" />
              <div className="space-y-3 p-5 text-sm">
                <p className="font-semibold text-ink">Catalog</p>
                <p className="flex items-center gap-2 text-ink-2">
                  <FileText className="size-4 text-faint" aria-hidden />
                  {auction.hasDocs ? "Catalog & STC documents published" : "No documents attached yet"}
                </p>
                <p className="text-[0.8rem] leading-relaxed text-muted">
                  Download the official catalog and Special Terms & Conditions from {auction.source} before bidding. Terms vary by auction.
                </p>
              </div>
            </div>
            <div className="flex gap-3 rounded-2xl border border-line bg-surface-2 p-4 text-[0.8rem] leading-relaxed text-muted">
              <Info className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
              Lelam is independent and not affiliated with {auction.source}. Valuations are indicative. Inspect lots in person.
            </div>
          </aside>
        </div>
      </div>

      {related.length > 0 && (
        <section className="container-page border-t border-line py-16">
          <h2 className="text-2xl font-semibold text-ink">More {cat.label.toLowerCase()} auctions</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((a) => (
              <AuctionCard key={a.id} auction={a} />
            ))}
          </div>
        </section>
      )}
    </WatchlistProvider>
  );
}
