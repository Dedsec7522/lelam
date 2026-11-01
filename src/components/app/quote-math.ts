export interface QuoteLineInput {
  description: string;
  quantity: number;
  unit: string;
  rate: number;
}

export interface QuoteTotals {
  subtotal: number;
  margin: number;
  taxable: number;
  gst: number;
  total: number;
}

/** Margin is applied on cost, GST on (cost + margin). Values are rounded to paise. */
export function quoteTotals(lines: QuoteLineInput[], marginPct: number, gstRate: number): QuoteTotals {
  const r = (n: number) => Math.round(n * 100) / 100;
  const subtotal = r(lines.reduce((s, l) => s + (Number.isFinite(l.quantity) ? l.quantity : 0) * (Number.isFinite(l.rate) ? l.rate : 0), 0));
  const margin = r((subtotal * (marginPct || 0)) / 100);
  const taxable = r(subtotal + margin);
  const gst = r((taxable * (gstRate || 0)) / 100);
  return { subtotal, margin, taxable, gst, total: r(taxable + gst) };
}

/** Per-line selling rate after margin (shown on the client-facing quote). */
export function sellRate(rate: number, marginPct: number) {
  return Math.round(rate * (1 + (marginPct || 0) / 100) * 100) / 100;
}
