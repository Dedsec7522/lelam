import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { read } from "@/server/store";
import { PageHeader } from "@/components/app/page-header";
import { NotificationsClient } from "@/components/app/dashboard/notifications-client";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser("/dashboard/notifications");
  const items = await read((db) =>
    db.notifications.filter((n) => n.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );
  return (
    <>
      <PageHeader eyebrow="Inbox" title="Notifications" description="Auction alerts, quote updates and account messages." />
      <NotificationsClient initial={items} />
    </>
  );
}
