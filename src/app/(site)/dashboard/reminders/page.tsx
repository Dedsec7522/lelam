import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { read } from "@/server/store";
import { auctionOptionsFor, auctionTitle, hasFeature, requestTime } from "@/server/workspace";
import { PageHeader } from "@/components/app/page-header";
import { UpgradePanel } from "@/components/app/upgrade-panel";
import { RemindersClient } from "@/components/app/dashboard/reminders-client";

export const metadata: Metadata = { title: "Reminders" };

export default async function RemindersPage({ searchParams }: { searchParams: Promise<{ auction?: string; new?: string }> }) {
  const user = await requireUser("/dashboard/reminders");
  const header = (
    <PageHeader eyebrow="Reminders" title="Reminders" description="Inspection windows, EMD deadlines and closing times, on the channel you prefer." />
  );
  if (!hasFeature(user, "reminders")) {
    return (
      <>
        {header}
        <UpgradePanel feature="reminders" />
      </>
    );
  }
  const sp = await searchParams;
  const [items, options] = await Promise.all([read((db) => db.reminders.filter((r) => r.userId === user.id)), auctionOptionsFor(user.id)]);
  const titles = Object.fromEntries(items.flatMap((r) => (r.auctionId ? [[r.auctionId, auctionTitle(r.auctionId) ?? ""]] : [])));
  const prefillTitle = sp.auction ? auctionTitle(sp.auction) : undefined;

  return (
    <>
      {header}
      <RemindersClient
        initial={items}
        options={options}
        titles={titles}
        now={requestTime()}
        draft={prefillTitle ? { auctionId: sp.auction, title: `Bid on ${prefillTitle}`, channel: "email" } : undefined}
        openOnMount={sp.new === "1"}
      />
    </>
  );
}
