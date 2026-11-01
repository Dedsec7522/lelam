"use client";

import Link from "next/link";
import { Gavel, Pencil, Trash2 } from "lucide-react";
import { Badge, Card, Stat } from "@/components/ui/primitives";
import { formatDate, formatINR } from "@/lib/format";
import { CrudManager, RowAction, type FieldDef } from "../crud-manager";
import { BID_STATUSES, type BidStatus } from "../options";

export interface BidRow {
  id: string;
  auctionId: string;
  lotNo?: string;
  amount: number;
  status: BidStatus;
  note?: string;
  createdAt: string;
}

const STATUS_TONE = { placed: "brand", won: "positive", lost: "danger", withdrawn: "neutral" } as const;
const LABEL: Record<BidStatus, string> = { placed: "Placed", won: "Won", lost: "Lost", withdrawn: "Withdrawn" };

export function BidsClient({ initial, options, titles }: { initial: BidRow[]; options: { id: string; label: string }[]; titles: Record<string, string> }) {
  const fields: FieldDef[] = [
    {
      name: "auctionId",
      label: "Auction Ref ID",
      type: "text",
      required: true,
      placeholder: "e.g. 41007",
      hint: options.length ? "Pick from your watchlist or type any Ref ID." : "Copy the Ref ID from the auction page.",
      suggestions: options.map((o) => ({ value: o.id, label: o.label })),
    },
    { name: "lotNo", label: "Lot number", type: "text", placeholder: "e.g. 03/21" },
    { name: "amount", label: "Bid amount (₹)", type: "number", required: true, min: 1, step: "1" },
    { name: "status", label: "Status", type: "select", options: BID_STATUSES.map((s) => ({ value: s, label: LABEL[s] })) },
    { name: "note", label: "Note", type: "textarea", placeholder: "H1 rank, competitor bids, payment due date…" },
  ];

  return (
    <CrudManager<BidRow>
      endpoint="/api/bids"
      initial={initial}
      fields={fields}
      noun="bid"
      addLabel="Log a bid"
      sort={(a, b) => b.createdAt.localeCompare(a.createdAt)}
      empty={{ title: "No bids logged yet", description: "Record each bid you place on the official portal to see your win rate and spend.", icon: <Gavel className="size-5" /> }}
      summary={(items) => {
        const won = items.filter((b) => b.status === "won");
        const decided = items.filter((b) => b.status === "won" || b.status === "lost").length;
        return (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Bids" value={items.length} hint={`${items.filter((b) => b.status === "placed").length} awaiting result`} />
            <Stat label="Won" value={won.length} tone="positive" hint={`${items.filter((b) => b.status === "lost").length} lost`} />
            <Stat label="Win rate" value={decided ? `${Math.round((won.length / decided) * 100)}%` : "—"} hint="Of decided bids" />
            <Stat label="Won value" value={formatINR(won.reduce((s, b) => s + b.amount, 0), { compact: true })} tone="copper" hint="Total of winning bids" />
          </div>
        );
      }}
      renderItem={(b, ctl) => (
        <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={STATUS_TONE[b.status]}>{LABEL[b.status]}</Badge>
              <span className="font-mono text-lg font-medium tabular-nums text-ink">{formatINR(b.amount)}</span>
            </div>
            <p className="mt-1 truncate text-sm text-ink-2">
              <Link href={`/auctions/${b.auctionId}`} className="font-medium hover:text-brand">
                Ref {b.auctionId}
              </Link>
              {titles[b.auctionId] && <span className="text-muted"> · {titles[b.auctionId]}</span>}
              {b.lotNo && <span className="text-muted"> · Lot {b.lotNo}</span>}
            </p>
            {b.note && <p className="mt-1 line-clamp-2 text-sm text-muted">{b.note}</p>}
            <p className="mt-1 text-xs text-faint">Logged {formatDate(b.createdAt)}</p>
          </div>
          <div className="flex items-center gap-1 self-end sm:self-center">
            <label className="sr-only" htmlFor={`status-${b.id}`}>
              Change status
            </label>
            <select
              id={`status-${b.id}`}
              value={b.status}
              disabled={ctl.busy}
              onChange={(e) => void ctl.patch({ status: e.target.value }, `Marked as ${LABEL[e.target.value as BidStatus].toLowerCase()}`)}
              className="h-11 rounded-xl border border-line-strong bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/12"
            >
              {BID_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {LABEL[s]}
                </option>
              ))}
            </select>
            <RowAction label="Edit bid" onClick={ctl.edit}>
              <Pencil className="size-[18px]" />
            </RowAction>
            <RowAction label="Delete bid" tone="danger" onClick={ctl.remove}>
              <Trash2 className="size-[18px]" />
            </RowAction>
          </div>
        </Card>
      )}
    />
  );
}
