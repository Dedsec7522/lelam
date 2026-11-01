import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/session";
import { read } from "@/server/store";
import { auctionTitle, canTouch, hasFeature } from "@/server/workspace";
import { PageHeader } from "@/components/app/page-header";
import { UpgradePanel } from "@/components/app/upgrade-panel";
import { PrintSheet } from "@/components/app/dashboard/print-sheet";
import { quoteTotals, sellRate } from "@/components/app/quote-math";
import { Logo } from "@/components/ui/logo";
import { formatDate, formatINR, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Print quote" };

export default async function PrintQuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ auto?: string }>;
}) {
  const { id } = await params;
  const user = await requireUser(`/dashboard/quotes/${id}/print`);
  if (!hasFeature(user, "quoteBuilder")) {
    return (
      <>
        <PageHeader eyebrow="Quote Builder" title="Export quote" />
        <UpgradePanel feature="quoteBuilder" />
      </>
    );
  }
  const quote = await read((db) => db.quotes.find((q) => q.id === id));
  if (!quote || !canTouch(user, quote)) notFound();
  const { auto } = await searchParams;
  const t = quoteTotals(quote.lines, quote.marginPct, quote.gstRate);
  const ref = auctionTitle(quote.auctionId);
  const validTill = new Date(Date.parse(quote.createdAt) + 7 * 86_400_000).toISOString();

  return (
    <PrintSheet backHref={`/dashboard/quotes/${quote.id}`} autoPrint={auto === "1"}>
      <article className="mx-auto max-w-[210mm] rounded-2xl border border-line bg-surface p-6 text-ink shadow-xs sm:p-10 print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="flex flex-col gap-6 border-b border-line pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xl font-semibold">{user.company || user.name}</p>
            <p className="mt-1 text-sm text-muted">{user.email}</p>
            {user.phone && <p className="text-sm text-muted">{user.phone}</p>}
          </div>
          <div className="sm:text-right">
            <p className="eyebrow">Quotation</p>
            <p className="mt-1 font-mono text-lg">{quote.number}</p>
            <p className="text-sm text-muted">Date: {formatDate(quote.createdAt)}</p>
            <p className="text-sm text-muted">Valid till: {formatDate(validTill)}</p>
          </div>
        </header>

        <section className="grid gap-4 py-6 sm:grid-cols-2">
          <div>
            <p className="eyebrow text-[0.66rem]">Bill to</p>
            <p className="mt-1 font-medium">{quote.client}</p>
          </div>
          {quote.auctionId && (
            <div className="sm:text-right">
              <p className="eyebrow text-[0.66rem]">Source</p>
              <p className="mt-1 text-sm">
                Auction Ref {quote.auctionId}
                {ref ? ` · ${ref}` : ""}
              </p>
            </div>
          )}
        </section>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="border-y border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="py-2 pr-3 font-medium">#</th>
                <th className="py-2 pr-3 font-medium">Description</th>
                <th className="py-2 pr-3 text-right font-medium">Qty</th>
                <th className="py-2 pr-3 font-medium">Unit</th>
                <th className="py-2 pr-3 text-right font-medium">Rate</th>
                <th className="py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {quote.lines.map((l, i) => {
                const rate = sellRate(l.rate, quote.marginPct);
                return (
                  <tr key={i} className="border-b border-line align-top">
                    <td className="py-2.5 pr-3 text-muted">{i + 1}</td>
                    <td className="py-2.5 pr-3">{l.description}</td>
                    <td className="py-2.5 pr-3 text-right font-mono tabular-nums">{formatNumber(l.quantity, 3)}</td>
                    <td className="py-2.5 pr-3">{l.unit}</td>
                    <td className="py-2.5 pr-3 text-right font-mono tabular-nums">{formatINR(rate, { decimals: 2 })}</td>
                    <td className="py-2.5 text-right font-mono tabular-nums">{formatINR(rate * l.quantity, { decimals: 2 })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <section className="mt-6 flex justify-end">
          <dl className="grid w-full max-w-xs gap-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Taxable value</dt>
              <dd className="font-mono tabular-nums">{formatINR(t.taxable, { decimals: 2 })}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">GST @ {quote.gstRate}%</dt>
              <dd className="font-mono tabular-nums">{formatINR(t.gst, { decimals: 2 })}</dd>
            </div>
            <div className="mt-1 flex justify-between border-t border-line pt-2 text-base font-semibold">
              <dt>Total</dt>
              <dd className="font-mono tabular-nums">{formatINR(t.total, { decimals: 2 })}</dd>
            </div>
          </dl>
        </section>

        {quote.terms && (
          <section className="mt-8 border-t border-line pt-4">
            <p className="eyebrow text-[0.66rem]">Terms & conditions</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-2">{quote.terms}</p>
          </section>
        )}

        <footer className="mt-10 flex items-center justify-between gap-4 border-t border-line pt-4 text-xs text-muted">
          <span>Prepared with Lelam Quote Builder</span>
          <Logo />
        </footer>
      </article>
    </PrintSheet>
  );
}
