"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Plus, Printer, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field";
import { Badge, Card } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { formatINR } from "@/lib/format";
import { motionTokens, springs } from "@/lib/motion";
import { api } from "../api-client";
import { ConfirmDialog, RowAction } from "../crud-manager";
import { quoteTotals } from "../quote-math";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

export interface QuoteDraft {
  id?: string;
  number?: string;
  client: string;
  auctionId?: string;
  lines: { description: string; quantity: number; unit: string; rate: number }[];
  gstRate: number;
  marginPct: number;
  terms: string;
  status: "draft" | "sent";
}

interface LineState {
  key: number;
  description: string;
  quantity: string;
  unit: string;
  rate: string;
}

const GST_OPTIONS = [0, 5, 12, 18, 28];
let seq = 0;
const toLine = (l: QuoteDraft["lines"][number]): LineState => ({
  key: ++seq,
  description: l.description,
  quantity: String(l.quantity),
  unit: l.unit,
  rate: String(l.rate),
});
const num = (s: string) => (s.trim() === "" ? Number.NaN : Number(s));

export function QuoteBuilder({ initial, auctionLabel, options }: { initial: QuoteDraft; auctionLabel?: string; options: { id: string; label: string }[] }) {
  const [client, setClient] = useState(initial.client);
  const [auctionId, setAuctionId] = useState(initial.auctionId ?? "");
  const [lines, setLines] = useState<LineState[]>(() => (initial.lines.length ? initial.lines.map(toLine) : [toLine({ description: "", quantity: 1, unit: "MT", rate: 0 })]));
  const [gstRate, setGstRate] = useState(initial.gstRate);
  const [marginPct, setMarginPct] = useState(String(initial.marginPct));
  const [terms, setTerms] = useState(initial.terms);
  const [status, setStatus] = useState(initial.status);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState<null | "save" | "send" | "print">(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();
  const router = useRouter();
  const reduce = useSafeReducedMotion();

  const parsedLines = lines.map((l) => ({ description: l.description.trim(), quantity: num(l.quantity), unit: l.unit.trim(), rate: num(l.rate) }));
  const margin = num(marginPct);
  const totals = quoteTotals(parsedLines, Number.isFinite(margin) ? margin : 0, gstRate);

  const update = (key: number, patch: Partial<LineState>) => setLines((cur) => cur.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  async function save(intent: "save" | "send" | "print") {
    setSaving(intent);
    setErrors({});
    setFormError("");
    const nextStatus = intent === "send" ? "sent" : status;
    const body = {
      client,
      auctionId,
      lines: parsedLines,
      gstRate,
      marginPct: margin,
      terms,
      status: nextStatus,
    };
    const res = initial.id
      ? await api<{ item: { id: string } }>(`/api/quotes/${initial.id}`, "PATCH", body)
      : await api<{ item: { id: string } }>("/api/quotes", "POST", body);
    setSaving(null);
    if (!res.ok) {
      setErrors(res.fields);
      setFormError(res.error);
      requestAnimationFrame(() => document.querySelector<HTMLElement>("#quote-form [aria-invalid=true]")?.focus());
      return;
    }
    setStatus(nextStatus);
    const id = res.data.item.id;
    if (intent === "print") {
      router.push(`/dashboard/quotes/${id}/print?auto=1`);
      return;
    }
    toast({ tone: "success", title: intent === "send" ? "Quote marked as sent" : "Quote saved" });
    if (!initial.id) router.replace(`/dashboard/quotes/${id}`);
    else router.refresh();
  }

  async function remove() {
    if (!initial.id) return;
    setDeleting(true);
    const res = await api<{ ok: true }>(`/api/quotes/${initial.id}`, "DELETE");
    setDeleting(false);
    if (!res.ok) {
      toast({ tone: "error", title: "Could not delete", description: res.error });
      return;
    }
    toast({ tone: "success", title: "Quote deleted" });
    router.push("/dashboard/quotes");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void save("save");
  }

  const lineError = (i: number, f: string) => errors[`lines.${i}.${f}`];

  return (
    <form id="quote-form" onSubmit={onSubmit} noValidate className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid min-w-0 gap-6">
        <Card className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <div className="flex items-center gap-2 sm:col-span-2">
            <h2 className="text-lg font-semibold text-ink">{initial.number ?? "New quote"}</h2>
            <Badge tone={status === "sent" ? "positive" : "neutral"}>{status === "sent" ? "Sent" : "Draft"}</Badge>
          </div>
          <Input label="Client" required value={client} onChange={(e) => setClient(e.target.value)} error={errors.client} placeholder="Buyer or company name" />
          <div>
            <Input
              label="Auction Ref ID"
              value={auctionId}
              onChange={(e) => setAuctionId(e.target.value)}
              error={errors.auctionId}
              hint={auctionLabel ?? "Optional"}
              list="quote-auctions"
            />
            <datalist id="quote-auctions">
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </datalist>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-ink">Line items</h2>
            <span className="text-sm text-muted">{lines.length} / 60</span>
          </div>
          <div className="hidden grid-cols-[minmax(0,1fr)_96px_80px_120px_120px_44px] gap-3 px-1 pb-2 text-xs font-medium uppercase tracking-wide text-muted md:grid">
            <span>Description</span>
            <span>Qty</span>
            <span>Unit</span>
            <span>Cost rate (₹)</span>
            <span className="text-right">Amount</span>
            <span className="sr-only">Remove</span>
          </div>
          <ul className="grid gap-3">
            <AnimatePresence initial={false}>
              {lines.map((l, i) => {
                const amount = (num(l.quantity) || 0) * (num(l.rate) || 0);
                return (
                  <motion.li
                    key={l.key}
                    layout={!reduce}
                    initial={{ opacity: 0, y: reduce ? 0 : motionTokens.distance.xs }}
                    animate={{ opacity: 1, y: 0, transition: springs.gentle }}
                    exit={{ opacity: 0, transition: { duration: motionTokens.duration.fast } }}
                    className="grid grid-cols-2 gap-3 rounded-xl border border-line p-3 md:grid-cols-[minmax(0,1fr)_96px_80px_120px_120px_44px] md:items-start md:border-0 md:p-1"
                  >
                    <Input
                      label={`Line ${i + 1} description`}
                      className="col-span-2 md:col-span-1 [&>label]:md:sr-only"
                      value={l.description}
                      onChange={(e) => update(l.key, { description: e.target.value })}
                      error={lineError(i, "description")}
                      placeholder="Item description"
                    />
                    <Input
                      label="Qty"
                      className="[&>label]:md:sr-only"
                      inputMode="decimal"
                      value={l.quantity}
                      onChange={(e) => update(l.key, { quantity: e.target.value })}
                      error={lineError(i, "quantity")}
                    />
                    <Input label="Unit" className="[&>label]:md:sr-only" value={l.unit} onChange={(e) => update(l.key, { unit: e.target.value })} error={lineError(i, "unit")} />
                    <Input
                      label="Cost rate (₹)"
                      className="[&>label]:md:sr-only"
                      inputMode="decimal"
                      value={l.rate}
                      onChange={(e) => update(l.key, { rate: e.target.value })}
                      error={lineError(i, "rate")}
                    />
                    <p className="flex h-11 items-center justify-end font-mono text-sm tabular-nums text-ink md:justify-end">
                      <span className="mr-auto text-xs text-muted md:hidden">Amount</span>
                      {formatINR(amount)}
                    </p>
                    <div className="col-span-2 flex justify-end md:col-span-1">
                      <RowAction label={`Remove line ${i + 1}`} tone="danger" disabled={lines.length === 1} onClick={() => setLines((cur) => cur.filter((x) => x.key !== l.key))}>
                        <Trash2 className="size-[18px]" />
                      </RowAction>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
          {errors.lines && <p role="alert" className="mt-2 text-[0.8rem] font-medium text-danger">{errors.lines}</p>}
          <Button
            variant="secondary"
            size="sm"
            className="mt-4 min-h-11"
            disabled={lines.length >= 60}
            onClick={() => setLines((cur) => [...cur, toLine({ description: "", quantity: 1, unit: cur[cur.length - 1]?.unit || "MT", rate: 0 })])}
          >
            <Plus className="size-4" aria-hidden /> Add line
          </Button>
        </Card>

        <Card className="p-5 sm:p-6">
          <Textarea
            label="Terms & conditions"
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            error={errors.terms}
            hint="Payment terms, delivery basis, validity."
          />
        </Card>
      </div>

      <aside className="min-w-0 xl:sticky xl:top-[96px] xl:self-start">
        <Card className="grid gap-4 p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-3">
            <Select label="GST" value={String(gstRate)} onChange={(e) => setGstRate(Number(e.target.value))} error={errors.gstRate}>
              {GST_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}%
                </option>
              ))}
            </Select>
            <Input label="Margin %" inputMode="decimal" value={marginPct} onChange={(e) => setMarginPct(e.target.value)} error={errors.marginPct} />
          </div>
          <dl className="grid gap-2 border-t border-line pt-4 text-sm" aria-live="polite">
            <Row label="Cost subtotal" value={totals.subtotal} />
            <Row label={`Margin (${Number.isFinite(margin) ? margin : 0}%)`} value={totals.margin} />
            <Row label="Taxable value" value={totals.taxable} />
            <Row label={`GST (${gstRate}%)`} value={totals.gst} />
            <div className="mt-2 flex items-baseline justify-between border-t border-line pt-3">
              <dt className="font-semibold text-ink">Quote total</dt>
              <dd className="font-mono text-xl font-medium tabular-nums text-ink">{formatINR(totals.total, { decimals: 2 })}</dd>
            </div>
          </dl>
          {formError && (
            <p role="alert" className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
              {formError}
            </p>
          )}
          <div className="grid gap-2">
            <Button type="submit" loading={saving === "save"} disabled={saving !== null}>
              Save quote
            </Button>
            <Button variant="secondary" onClick={() => void save("print")} loading={saving === "print"} disabled={saving !== null}>
              <Printer className="size-4" aria-hidden /> Export PDF
            </Button>
            {status !== "sent" && (
              <Button variant="ghost" onClick={() => void save("send")} loading={saving === "send"} disabled={saving !== null}>
                <Send className="size-4" aria-hidden /> Save & mark as sent
              </Button>
            )}
            {initial.id && (
              <Button variant="ghost" className="text-danger hover:bg-danger-soft hover:text-danger" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="size-4" aria-hidden /> Delete quote
              </Button>
            )}
          </div>
          <Link href="/dashboard/quotes" className="inline-flex min-h-11 items-center justify-center text-sm font-medium text-muted hover:text-ink">
            Back to all quotes
          </Link>
        </Card>
      </aside>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete this quote?"
        description="This cannot be undone."
        confirmLabel="Delete"
        busy={deleting}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void remove()}
      />
    </form>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="font-mono tabular-nums text-ink-2">{formatINR(value, { decimals: 2 })}</dd>
    </div>
  );
}
