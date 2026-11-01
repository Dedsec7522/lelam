import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { read } from "@/server/store";
import { hasFeature } from "@/server/workspace";
import { PageHeader } from "@/components/app/page-header";
import { UpgradePanel } from "@/components/app/upgrade-panel";
import { VendorsClient } from "@/components/app/dashboard/vendors-client";

export const metadata: Metadata = { title: "Vendors" };

export default async function VendorsPage() {
  const user = await requireUser("/dashboard/vendors");
  const header = (
    <PageHeader eyebrow="Directory" title="Vendors" description="Transporters, loaders, recyclers and buyers you work with, one tap away." />
  );
  if (!hasFeature(user, "inventory")) {
    return (
      <>
        {header}
        <UpgradePanel feature="inventory" />
      </>
    );
  }
  const items = await read((db) => db.vendors.filter((v) => v.userId === user.id));
  return (
    <>
      {header}
      <VendorsClient initial={items} />
    </>
  );
}
