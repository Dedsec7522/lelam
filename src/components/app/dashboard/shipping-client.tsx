"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, Trash2, Truck } from "lucide-react";
import { Badge, Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { formatDate, formatINR, formatNumber } from "@/lib/format";
import { api } from "../api-client";
import { CrudManager, RowAction, type FieldDef, type FieldValue } from "../crud-manager";
import { VEHICLES } from "../options";

export interface ShippingQuote {
  partnerId: string;
  partnerName: string;
  amount: number;
  etaDays: number;
  createdAt: string;
}

export interface ShippingRow {
  id: string;
  auctionId?: string;
  pickup: string;
  drop: string;
  weightTonnes: number;
  vehicle: string;
  status: "open" | "quoted" | "accepted" | "closed";
  quotes: ShippingQuote[];
  createdAt: string;
}

export const SHIPPING_STATUS = {
  open: { label: "Awaiting quotes", tone: "neutral" },
  quoted: { label: "Quotes in", tone: "brand" },
  accepted: { label: "Accepted", tone: "positive" },
  closed: { label: "Closed", tone: "neutral" },
} as const;

export function ShippingClient({
  initial,
  options,
  draft,
  openOnMount,
}: {
  initial: ShippingRow[];
  options: { id: string; label: string }[];
  draft?: Record<string, FieldValue>;
  openOnMount?: boolean;
}) {
  const toast = useToast();
  const [accepting, setAccepting] = useState<string | null>(null);

  const fields: FieldDef[] = [
    { name: "pickup", label: "Pickup location", type: "text", required: true, placeholder: "Seller yard, city", wide: true },
    { name: "drop", label: "Drop location", type: "text", required: true, placeholder: "Your yard, city", wide: true },
    { name: "weightTonnes", label: "Weight (tonnes)", type: "number", required: true, step: "0.01", min: 0 },
    { name: "vehicle", label: "Vehicle", type: "select", options: VEHICLES.map((v) => ({ value: v, label: v })) },
    {
      name: "auctionId",
      label: "Auction Ref ID",
      type: "text",
      hint: "Optional",
      suggestions: options.map((o) => ({ value: o.id, label: o.label })),
      wide: true,
    },
  ];

  return (
    <CrudManager<ShippingRow>
      endpoint="/api/shipping"
      initial={initial}
      fields={fields}
      noun="request"
      addLabel="New request"
      draft={draft}
      openOnMount={openOnMount}
      sort={(a, b) => b.createdAt.localeCompare(a.createdAt)}
      empty={{ title: "No shipping requests", description: "Request transport for a lot you won and partners will send you prices.", icon: <Truck className="size-5" /> }}
      renderItem={(r, ctl) => {
        const s = SHIPPING_STATUS[r.status];
        const sortedQuotes = r.status === "accepted" ? r.quotes : [...r.quotes].sort((a, b) => a.amount - b.amount);
        async function accept(partnerId: string) {
          setAccepting(`${r.id}:${partnerId}`);
          const res = await api<{ item: ShippingRow }>(`/api/shipping/${r.id}/accept`, "POST", { partnerId });
          setAccepting(null);
          if (!res.ok) {
            toast({ tone: "error", title: "Could not accept", description: res.error });
            return;
          }
          ctl.replace(res.data.item);
          toast({ tone: "success", title: "Quote accepted", description: "The partner has been notified." });
        }
        return (
          <Card className="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={s.tone}>{s.label}</Badge>
                  <span className="text-xs text-muted">Posted {formatDate(r.createdAt)}</span>
                </div>
                <p className="mt-2 flex flex-wrap items-center gap-x-2 font-semibold text-ink">
                  <span className="break-words">{r.pickup}</span>
                  <ArrowRight className="size-4 shrink-0 text-muted" aria-label="to" />
                  <span className="break-words">{r.drop}</span>
                </p>
                <p className="mt-1 text-sm text-muted">
                  {formatNumber(r.weightTonnes, 2)} T · {r.vehicle}
                  {r.auctionId && (
                    <>
                      {" · "}
                      <Link href={`/auctions/${r.auctionId}`} className="font-medium text-brand hover:underline">
                        Ref {r.auctionId}
                      </Link>
                    </>
                  )}
                </p>
              </div>
              {r.status !== "accepted" && (
                <RowAction label="Cancel request" tone="danger" onClick={ctl.remove}>
                  <Trash2 className="size-[18px]" />
                </RowAction>
              )}
            </div>

            {sortedQuotes.length > 0 ? (
              <ul className="mt-4 grid gap-2 border-t border-line pt-4" aria-label="Partner quotes">
                {sortedQuotes.map((q, i) => {
                  const won = r.status === "accepted" && i === 0;
                  return (
                    <li
                      key={q.partnerId}
                      className={cn(
                        "flex flex-col gap-2 rounded-xl border border-line p-3 sm:flex-row sm:items-center",
                        won && "border-positive/40 bg-positive-soft",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-sm font-medium text-ink">
                          {won && <CheckCircle2 className="size-4 text-positive" aria-hidden />}
                          {q.partnerName}
                          {!won && r.status !== "accepted" && i === 0 && sortedQuotes.length > 1 && <Badge tone="positive">Lowest</Badge>}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-muted">
                          <Clock className="size-3.5" aria-hidden /> {q.etaDays} day{q.etaDays === 1 ? "" : "s"} · quoted {formatDate(q.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className="font-mono text-base font-medium tabular-nums text-ink">{formatINR(q.amount)}</span>
                        {r.status === "quoted" && (
                          <Button size="sm" className="min-h-11" loading={accepting === `${r.id}:${q.partnerId}`} onClick={() => void accept(q.partnerId)}>
                            Accept
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-4 border-t border-line pt-4 text-sm text-muted">Partners usually respond within a few hours. You will get a notification.</p>
            )}
          </Card>
        );
      }}
    />
  );
}
