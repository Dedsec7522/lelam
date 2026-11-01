import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Truck } from "lucide-react";
import { requireRole } from "@/server/session";
import { partnerBoard } from "@/server/logistics";
import { PageHeader } from "@/components/app/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Card, EmptyState, Stat } from "@/components/ui/primitives";
import { formatDate, formatINR, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

export default async function LogisticsDashboard() {
  const user = await requireRole(["logistics", "admin"], "/logistics");
  const board = await partnerBoard(user.id);
  const open = board.filter((r) => r.status === "open" || r.status === "quoted");
  const awaiting = open.filter((r) => !r.myQuote);
  const won = board.filter((r) => r.won);
  const quoted = board.filter((r) => r.myQuote);

  return (
    <>
      <PageHeader
        eyebrow="Logistics portal"
        title="Open transport requests"
        description="Buyers who won auction lots need pickups. Quote a price and ETA; they are notified instantly."
        action={<ButtonLink href="/logistics/requests">Quote on requests</ButtonLink>}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Open requests" value={open.length} />
        <Stat label="Need your quote" value={awaiting.length} tone="copper" />
        <Stat label="Quotes sent" value={quoted.length} />
        <Stat label="Won" value={won.length} tone="positive" hint={formatINR(won.reduce((s, r) => s + (r.myQuote?.amount ?? 0), 0), { compact: true })} />
      </div>

      <Card className="mt-8 p-5 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-ink">Waiting for your quote</h2>
        {awaiting.length === 0 ? (
          <EmptyState icon={<Truck className="size-5" />} title="You are up to date" description="New requests from buyers will appear here." />
        ) : (
          <ul className="divide-y divide-line">
            {awaiting.slice(0, 8).map((r) => (
              <li key={r.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-x-2 font-medium text-ink">
                    {r.pickup} <ArrowRight className="size-4 text-muted" aria-label="to" /> {r.drop}
                  </p>
                  <p className="text-xs text-muted">
                    {formatNumber(r.weightTonnes, 2)} T · {r.vehicle} · posted {formatDate(r.createdAt)}
                  </p>
                </div>
                <Badge>{r.quoteCount} quote{r.quoteCount === 1 ? "" : "s"}</Badge>
              </li>
            ))}
          </ul>
        )}
        {awaiting.length > 0 && (
          <Link href="/logistics/requests" className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-brand hover:underline">
            Open the quote board
          </Link>
        )}
      </Card>
    </>
  );
}
