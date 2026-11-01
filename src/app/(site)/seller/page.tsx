import type { Metadata } from "next";
import Link from "next/link";
import { CirclePlus, Store } from "lucide-react";
import { requireRole } from "@/server/session";
import { read } from "@/server/store";
import { PageHeader } from "@/components/app/page-header";
import { ListingStatusBadge } from "@/components/app/seller/listing-status";
import { ButtonLink } from "@/components/ui/button";
import { Card, EmptyState, Stat } from "@/components/ui/primitives";
import { CATEGORY_BY_ID } from "@/lib/taxonomy";
import { formatDateTime, formatINR } from "@/lib/format";
import type { CategoryId } from "@/lib/types";

export const metadata: Metadata = { title: "Overview" };

export default async function SellerOverview() {
  const user = await requireRole(["seller", "admin"], "/seller");
  const listings = await read((db) =>
    db.sellerAuctions.filter((a) => a.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );
  const count = (s: string) => listings.filter((l) => l.status === s).length;
  const reserve = listings.filter((l) => l.status === "published").reduce((s, l) => s + l.reservePrice, 0);

  return (
    <>
      <PageHeader
        eyebrow="Seller portal"
        title="Your auctions on Lelam"
        description="List surplus, scrap and assets. Our team reviews each listing before it goes live to buyers."
        action={
          <ButtonLink href="/seller/auctions/create">
            <CirclePlus className="size-4" aria-hidden /> Create listing
          </ButtonLink>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Published" value={count("published")} tone="positive" />
        <Stat label="In review" value={count("pending")} />
        <Stat label="Needs changes" value={count("draft")} />
        <Stat label="Live reserve" value={formatINR(reserve, { compact: true })} tone="copper" hint="Published listings" />
      </div>

      <Card className="mt-8 p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ink">Recent listings</h2>
          <Link href="/seller/auctions" className="inline-flex min-h-11 items-center text-sm font-medium text-brand hover:underline">
            View all
          </Link>
        </div>
        {listings.length === 0 ? (
          <EmptyState
            icon={<Store className="size-5" />}
            title="No listings yet"
            description="Create your first listing with lot details, reserve price and auction window."
            action={<ButtonLink href="/seller/auctions/create" size="sm">Create listing</ButtonLink>}
          />
        ) : (
          <ul className="divide-y divide-line">
            {listings.slice(0, 5).map((l) => (
              <li key={l.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Link href={`/seller/auctions/${l.id}/edit`} className="block truncate font-medium text-ink hover:text-brand">
                    {l.title}
                  </Link>
                  <p className="text-xs text-muted">
                    {CATEGORY_BY_ID[l.category as CategoryId]?.label ?? l.category} · {l.city}, {l.state} · opens {formatDateTime(l.startsAt)}
                  </p>
                </div>
                <ListingStatusBadge status={l.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
