"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, CheckCircle2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/field";
import { Badge, Card, EmptyState } from "@/components/ui/primitives";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatINR, formatNumber } from "@/lib/format";
import { motionTokens, springs } from "@/lib/motion";
import { api } from "../api-client";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

export interface BoardRow {
  id: string;
  pickup: string;
  drop: string;
  weightTonnes: number;
  vehicle: string;
  auctionId?: string;
  status: "open" | "quoted" | "accepted" | "closed";
  createdAt: string;
  quoteCount: number;
  myQuote?: { amount: number; etaDays: number; createdAt: string };
  won: boolean;
}

type View = "todo" | "quoted" | "all";

export function QuoteBoard({ initial }: { initial: BoardRow[] }) {
  const [rows, setRows] = useState(initial);
  const [view, setView] = useState<View>("todo");
  const [target, setTarget] = useState<BoardRow | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [announce, setAnnounce] = useState("");
  const toast = useToast();
  const router = useRouter();
  const reduce = useSafeReducedMotion();

  const isOpen = (r: BoardRow) => r.status === "open" || r.status === "quoted";
  const shown = rows.filter((r) => (view === "all" ? true : view === "todo" ? isOpen(r) && !r.myQuote : Boolean(r.myQuote)));

  function close() {
    setTarget(null);
    setErrors({});
    setFormError("");
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!target) return;
    const fd = new FormData(e.currentTarget);
    const n = (k: string) => {
      const v = String(fd.get(k) ?? "").trim();
      return v === "" ? undefined : Number(v);
    };
    setSaving(true);
    setErrors({});
    setFormError("");
    const res = await api<{ item: { id: string; status: BoardRow["status"]; quoteCount: number; myQuote: NonNullable<BoardRow["myQuote"]> } }>(
      `/api/shipping/${target.id}/quote`,
      "POST",
      { amount: n("amount"), etaDays: n("etaDays") },
    );
    setSaving(false);
    if (!res.ok) {
      setErrors(res.fields);
      setFormError(res.error);
      return;
    }
    const it = res.data.item;
    setRows((cur) => cur.map((r) => (r.id === it.id ? { ...r, status: it.status, quoteCount: it.quoteCount, myQuote: it.myQuote } : r)));
    toast({ tone: "success", title: "Quote sent", description: "The buyer has been notified." });
    setAnnounce("Quote sent");
    close();
    router.refresh();
  }

  return (
    <div>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segmented<View>
          label="Filter requests"
          size="sm"
          value={view}
          onChange={setView}
          options={[
            { value: "todo", label: "Needs quote" },
            { value: "quoted", label: "My quotes" },
            { value: "all", label: "All" },
          ]}
        />
        <p className="text-sm text-muted">{shown.length} requests</p>
      </div>

      {shown.length === 0 ? (
        <EmptyState icon={<Truck className="size-5" />} title="Nothing here" description="When buyers post pickups, they appear on this board." />
      ) : (
        <ul className="grid gap-3">
          <AnimatePresence initial={false}>
            {shown.map((r) => (
              <motion.li
                key={r.id}
                layout={!reduce}
                initial={{ opacity: 0, y: reduce ? 0 : motionTokens.distance.sm }}
                animate={{ opacity: 1, y: 0, transition: springs.gentle }}
                exit={{ opacity: 0, transition: { duration: motionTokens.duration.fast } }}
              >
                <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {r.won ? (
                        <Badge tone="positive">
                          <CheckCircle2 className="size-3" aria-hidden /> You won this job
                        </Badge>
                      ) : r.status === "accepted" ? (
                        <Badge>Awarded to another partner</Badge>
                      ) : (
                        <Badge tone={r.myQuote ? "brand" : "copper"}>{r.myQuote ? "Quoted" : "Needs quote"}</Badge>
                      )}
                      <span className="text-xs text-muted">
                        {r.quoteCount} quote{r.quoteCount === 1 ? "" : "s"} · posted {formatDate(r.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 flex flex-wrap items-center gap-x-2 font-semibold text-ink">
                      <span className="break-words">{r.pickup}</span>
                      <ArrowRight className="size-4 shrink-0 text-muted" aria-label="to" />
                      <span className="break-words">{r.drop}</span>
                    </p>
                    <p className="mt-0.5 text-sm text-muted">
                      {formatNumber(r.weightTonnes, 2)} T · {r.vehicle}
                      {r.auctionId && ` · Auction ${r.auctionId}`}
                    </p>
                    {r.myQuote && (
                      <p className="mt-1 text-sm text-ink-2">
                        Your quote: <span className="font-mono font-medium tabular-nums">{formatINR(r.myQuote.amount)}</span> · {r.myQuote.etaDays} days
                      </p>
                    )}
                  </div>
                  {isOpen(r) && (
                    <Button variant={r.myQuote ? "secondary" : "primary"} className="self-end sm:self-center" onClick={() => setTarget(r)}>
                      {r.myQuote ? "Revise quote" : "Send quote"}
                    </Button>
                  )}
                </Card>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <Dialog
        open={target !== null}
        onClose={close}
        title={target?.myQuote ? "Revise your quote" : "Send a quote"}
        description={target ? `${target.pickup} → ${target.drop} · ${formatNumber(target.weightTonnes, 2)} T` : undefined}
        size="sm"
      >
        <form key={target?.id} onSubmit={submit} noValidate className="grid gap-4 px-6 py-5">
          <Input
            label="Price (₹, all-inclusive)"
            name="amount"
            type="number"
            inputMode="decimal"
            min={1}
            required
            defaultValue={target?.myQuote?.amount ?? ""}
            error={errors.amount}
            hint="Include loading, tolls and GST."
          />
          <Input
            label="Delivery in (days)"
            name="etaDays"
            type="number"
            inputMode="numeric"
            min={1}
            max={60}
            step="1"
            required
            defaultValue={target?.myQuote?.etaDays ?? ""}
            error={errors.etaDays}
          />
          {formError && Object.keys(errors).length === 0 && (
            <p role="alert" className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
              {formError}
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Send quote
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
