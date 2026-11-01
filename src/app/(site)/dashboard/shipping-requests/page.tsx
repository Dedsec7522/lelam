import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { catalog } from "@/server/catalog";
import { read } from "@/server/store";
import { auctionOptionsFor, hasFeature } from "@/server/workspace";
import { PageHeader } from "@/components/app/page-header";
import { UpgradePanel } from "@/components/app/upgrade-panel";
import { ShippingClient } from "@/components/app/dashboard/shipping-client";
import { vehicleFor } from "@/components/app/options";

export const metadata: Metadata = { title: "Shipping requests" };

export default async function ShippingRequestsPage({ searchParams }: { searchParams: Promise<{ new?: string; auction?: string }> }) {
  const user = await requireUser("/dashboard/shipping-requests");
  const header = (
    <PageHeader
      eyebrow="Logistics"
      title="Shipping requests"
      description="Post a pickup and compare quotes from verified transport partners. Accept the one that suits you."
    />
  );
  if (!hasFeature(user, "logisticsQuotes")) {
    return (
      <>
        {header}
        <UpgradePanel feature="logisticsQuotes" />
      </>
    );
  }
  const sp = await searchParams;
  const auction = sp.auction ? catalog().get(sp.auction) : undefined;
  const [items, options] = await Promise.all([
    read((db) => db.shippingRequests.filter((r) => r.userId === user.id)),
    auctionOptionsFor(user.id),
  ]);
  const weight = auction?.weightTonnes && auction.weightTonnes > 0 ? auction.weightTonnes : undefined;

  return (
    <>
      {header}
      <ShippingClient
        initial={items}
        options={options}
        openOnMount={sp.new === "1"}
        draft={
          auction
            ? {
                auctionId: auction.id,
                pickup: `${auction.seller}, ${auction.state}`,
                weightTonnes: weight,
                vehicle: vehicleFor(weight ?? 1),
              }
            : undefined
        }
      />
    </>
  );
}
