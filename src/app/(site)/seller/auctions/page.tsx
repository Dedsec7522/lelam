import type { Metadata } from "next";
import Link from "next/link";
import { CirclePlus, Pencil, Store } from "lucide-react";
import { requireRole } from "@/server/session";
import { read } from "@/server/store";
import { PageHeader } from "@/components/app/page-header";
import { ListingStatusBadge } from "@/components/app/seller/listing-status";
import { ButtonLink } from "@/components/ui/button";
import { Card, EmptyState } from "@/components/ui/primitives";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { CATEGORY_BY_ID } from "@/lib/taxonomy";
import { formatDateTime, formatINR } from "@/lib/format";
import type { CategoryId } from "@/lib/types";

export const metadata: Metadata = { title: "My listings" };

export default async function SellerListingsPage() {
  const user = await requireRole(["seller", "admin"], "/seller/auctions");
  const listings = await read((db) =>
    db.sellerAuctions.filter((a) => a.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );

  return (
    <>
      <PageHeader
        eyebrow="Seller portal"
        title="My listings"
        description="Drafts were returned by a reviewer; edit and resubmit them. Published listings are visible to buyers."
        action={
          <ButtonLink href="/seller/auctions/create">
            <CirclePlus className="size-4" aria-hidden /> Create listing
          </ButtonLink>
        }
      />
      {listings.length === 0 ? (
        <EmptyState
          icon={<Store className="size-5" />}
          title="No listings yet"
          description="Create a listing to reach buyers who track auctions on Lelam."
          action={<ButtonLink href="/seller/auctions/create">Create listing</ButtonLink>}
        />
      ) : (
        <Stagger as="ul" className="grid gap-3">
          {listings.map((l) => (
            <StaggerItem as="li" key={l.id}>
              <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
                <div className="min-w-0 flex-1">
                  <ListingStatusBadge status={l.status} />
                  <p className="mt-2 truncate font-semibold text-ink">{l.title}</p>
                  <p className="mt-0.5 text-sm text-muted">
                    {CATEGORY_BY_ID[l.category as CategoryId]?.label ?? l.category} · {l.city}, {l.state} · reserve {formatINR(l.reservePrice, { compact: true })} · EMD{" "}
                    {l.emdPercent}%
                  </p>
                  <p className="text-xs text-faint">
                    {formatDateTime(l.startsAt)} to {formatDateTime(l.endsAt)}
                  </p>
                </div>
                <Link
                  href={`/seller/auctions/${l.id}/edit`}
                  className="inline-flex min-h-11 items-center gap-2 self-end rounded-xl border border-line-strong px-4 text-sm font-medium text-ink hover:bg-surface-2 sm:self-center"
                >
                  <Pencil className="size-4" aria-hidden /> Edit
                </Link>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </>
  );
}
