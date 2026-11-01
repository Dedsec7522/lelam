import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Printer, ReceiptText } from "lucide-react";
import { requireUser } from "@/server/session";
import { read } from "@/server/store";
import { hasFeature } from "@/server/workspace";
import { PageHeader } from "@/components/app/page-header";
import { UpgradePanel } from "@/components/app/upgrade-panel";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Card, EmptyState, Stat } from "@/components/ui/primitives";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { quoteTotals } from "@/components/app/quote-math";
import { formatDate, formatINR } from "@/lib/format";

export const metadata: Metadata = { title: "Quotes" };

export default async function QuotesPage() {
  const user = await requireUser("/dashboard/quotes");
  const header = (
    <PageHeader
      eyebrow="Quote Builder"
      title="Quotes"
      description="Build resale quotes from auction lots with GST and margin, then export a print-ready PDF."
      action={
        hasFeature(user, "quoteBuilder") ? (
          <ButtonLink href="/dashboard/quotes/new">
            <Plus className="size-4" aria-hidden /> New quote
          </ButtonLink>
        ) : undefined
      }
    />
  );
  if (!hasFeature(user, "quoteBuilder")) {
    return (
      <>
        {header}
        <UpgradePanel feature="quoteBuilder" />
      </>
    );
  }

  const quotes = (await read((db) => db.quotes.filter((q) => q.userId === user.id)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((q) => ({ ...q, totals: quoteTotals(q.lines, q.marginPct, q.gstRate) }));
  const pipeline = quotes.reduce((s, q) => s + q.totals.total, 0);
  const sent = quotes.filter((q) => q.status === "sent");

  return (
    <>
      {header}
      {quotes.length === 0 ? (
        <EmptyState
          icon={<ReceiptText className="size-5" />}
          title="No quotes yet"
          description="Start from any auction in your watchlist to prefill its lots, or build one from scratch."
          action={<ButtonLink href="/dashboard/quotes/new">Create your first quote</ButtonLink>}
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-3 gap-3">
            <Stat label="Quotes" value={quotes.length} hint={`${quotes.length - sent.length} drafts`} />
            <Stat label="Sent" value={sent.length} tone="positive" />
            <Stat label="Pipeline" value={formatINR(pipeline, { compact: true })} tone="copper" hint="Incl. GST" />
          </div>
          <Stagger as="ul" className="grid gap-3">
            {quotes.map((q) => (
              <StaggerItem as="li" key={q.id}>
                <Card className="flex flex-col gap-3 p-4 transition-colors hover:border-brand/40 sm:flex-row sm:items-center sm:p-5">
                  <Link href={`/dashboard/quotes/${q.id}`} className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm text-muted">{q.number}</span>
                      <Badge tone={q.status === "sent" ? "positive" : "neutral"}>{q.status === "sent" ? "Sent" : "Draft"}</Badge>
                    </div>
                    <p className="mt-1 truncate font-semibold text-ink">{q.client}</p>
                    <p className="text-xs text-muted">
                      {q.lines.length} line{q.lines.length === 1 ? "" : "s"} · GST {q.gstRate}% · margin {q.marginPct}% · {formatDate(q.createdAt)}
                      {q.auctionId && ` · Ref ${q.auctionId}`}
                    </p>
                  </Link>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="font-mono text-base font-medium tabular-nums text-ink">{formatINR(q.totals.total)}</span>
                    <Link
                      href={`/dashboard/quotes/${q.id}/print`}
                      aria-label={`Print or export ${q.number}`}
                      title="Export PDF"
                      className="grid size-11 place-items-center rounded-xl text-muted hover:bg-paper-2 hover:text-ink"
                    >
                      <Printer className="size-[18px]" />
                    </Link>
                  </div>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </>
      )}
    </>
  );
}
