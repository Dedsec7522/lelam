import type { Metadata } from "next";
import { requireRole, toSafeUser } from "@/server/session";
import { read } from "@/server/store";
import { PageHeader } from "@/components/app/page-header";
import { AdminConsole } from "@/components/app/admin/admin-console";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Admin console", robots: { index: false, follow: false } };

export default async function AdminPage() {
  const admin = await requireRole(["admin"], "/admin");
  const data = await read((db) => {
    const emailById = new Map(db.users.map((u) => [u.id, u.email]));
    return {
      users: db.users.map(toSafeUser).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      leads: [...db.leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      listings: [...db.sellerAuctions]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((l) => ({ ...l, sellerEmail: emailById.get(l.userId) ?? "unknown" })),
      audit: db.audit
        .slice(-100)
        .reverse()
        .map((a) => ({ ...a, actorEmail: a.actorId ? (emailById.get(a.actorId) ?? a.actorId) : "system" })),
      subscriptions: db.subscriptions.length,
    };
  });

  return (
    <div className="container-page py-8 lg:py-12">
      <PageHeader
        eyebrow="Admin console"
        title="Run Lelam"
        description="Manage accounts and plans, follow up on leads, review seller listings and audit activity."
        action={
          <ButtonLink href="/dashboard" variant="secondary">
            My dashboard
          </ButtonLink>
        }
      />
      <AdminConsole selfId={admin.id} users={data.users} leads={data.leads} listings={data.listings} audit={data.audit} subscriptions={data.subscriptions} />
    </div>
  );
}
