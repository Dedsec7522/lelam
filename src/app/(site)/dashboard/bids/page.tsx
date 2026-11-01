import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { read } from "@/server/store";
import { auctionOptionsFor, auctionTitle } from "@/server/workspace";
import { PageHeader } from "@/components/app/page-header";
import { BidsClient } from "@/components/app/dashboard/bids-client";

export const metadata: Metadata = { title: "My bids" };

export default async function BidsPage() {
  const user = await requireUser("/dashboard/bids");
  const [bids, options] = await Promise.all([
    read((db) => db.bids.filter((b) => b.userId === user.id)),
    auctionOptionsFor(user.id),
  ]);
  const titles = Object.fromEntries(bids.map((b) => [b.auctionId, auctionTitle(b.auctionId) ?? ""]));

  return (
    <>
      <PageHeader
        eyebrow="Bid log"
        title="My bids"
        description="Lelam never bids for you. Log the bids you place on MSTC or BaankNet to track outcomes and your win rate."
      />
      <BidsClient initial={bids} options={options} titles={titles} />
    </>
  );
}
