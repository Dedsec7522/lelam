import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { read } from "@/server/store";
import { auctionOptionsFor, hasFeature } from "@/server/workspace";
import { PageHeader } from "@/components/app/page-header";
import { UpgradePanel } from "@/components/app/upgrade-panel";
import { InventoryClient } from "@/components/app/dashboard/inventory-client";

export const metadata: Metadata = { title: "Inventory" };

export default async function InventoryPage() {
  const user = await requireUser("/dashboard/inventory");
  const header = (
    <PageHeader eyebrow="Inventory" title="Inventory manager" description="Track material you have won: quantity, cost basis and where it is stored." />
  );
  if (!hasFeature(user, "inventory")) {
    return (
      <>
        {header}
        <UpgradePanel feature="inventory" />
      </>
    );
  }
  const [items, options] = await Promise.all([read((db) => db.inventory.filter((i) => i.userId === user.id)), auctionOptionsFor(user.id)]);
  return (
    <>
      {header}
      <InventoryClient initial={items} options={options} />
    </>
  );
}
