"use client";

import { Lock } from "lucide-react";
import { CATEGORIES, CATEGORY_BY_ID, OFFICES, STATES } from "@/lib/taxonomy";
import type { CategoryId } from "@/lib/types";
import { Checkbox, Input, Select } from "@/components/ui/field";

export interface FilterValues {
  category?: CategoryId;
  sub?: string;
  source?: "MSTC" | "BaankNet";
  state?: string;
  office?: string;
  prebid?: "required" | "none";
  docs?: boolean;
  images?: boolean;
  reauction?: boolean;
  status?: "upcoming" | "live" | "open";
  from?: string;
  to?: string;
  radius?: number;
}

export const FILTER_KEYS: (keyof FilterValues)[] = ["category", "sub", "source", "state", "office", "prebid", "docs", "images", "reauction", "status", "from", "to", "radius"];

export function countActive(f: FilterValues) {
  return FILTER_KEYS.filter((k) => f[k] !== undefined && f[k] !== "" && f[k] !== false).length;
}

export function FilterPanel({
  value,
  onChange,
  canReauction,
  nearActive,
}: {
  value: FilterValues;
  onChange: (next: FilterValues) => void;
  canReauction: boolean;
  nearActive: boolean;
}) {
  const set = <K extends keyof FilterValues>(k: K, v: FilterValues[K]) => onChange({ ...value, [k]: v || undefined });
  const subs = value.category ? CATEGORY_BY_ID[value.category].subCategories : [];

  return (
    <div className="space-y-6">
      <fieldset className="space-y-4">
        <legend className="eyebrow mb-3">What</legend>
        <Select
          label="Category"
          value={value.category ?? ""}
          onChange={(e) => onChange({ ...value, category: (e.target.value || undefined) as CategoryId | undefined, sub: undefined })}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </Select>
        <Select label="Sub-category" value={value.sub ?? ""} disabled={!value.category} onChange={(e) => set("sub", e.target.value)} hint={!value.category ? "Choose a category first" : undefined}>
          <option value="">All</option>
          {subs.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
        <Select label="Source" value={value.source ?? ""} onChange={(e) => set("source", e.target.value as FilterValues["source"])}>
          <option value="">MSTC + bank auctions</option>
          <option value="MSTC">MSTC e-auctions</option>
          <option value="BaankNet">Bank properties (BaankNet)</option>
        </Select>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="eyebrow mb-3">Where</legend>
        <Select label="State" value={value.state ?? ""} onChange={(e) => set("state", e.target.value)}>
          <option value="">All states</option>
          {STATES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
        <Select label="Regional office" value={value.office ?? ""} onChange={(e) => set("office", e.target.value)}>
          <option value="">All offices</option>
          {OFFICES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
        {nearActive && (
          <Select label="Radius from you" value={String(value.radius ?? 200)} onChange={(e) => set("radius", Number(e.target.value))}>
            {[50, 100, 200, 400, 800].map((r) => (
              <option key={r} value={r}>
                Within {r} km
              </option>
            ))}
          </Select>
        )}
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="eyebrow mb-3">When</legend>
        <Select label="Status" value={value.status ?? ""} onChange={(e) => set("status", e.target.value as FilterValues["status"])}>
          <option value="">Open & upcoming first</option>
          <option value="open">Open only (hide closed)</option>
          <option value="live">Live now</option>
          <option value="upcoming">Upcoming</option>
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <Input label="From" type="date" value={value.from ?? ""} onChange={(e) => set("from", e.target.value)} />
          <Input label="To" type="date" value={value.to ?? ""} min={value.from} onChange={(e) => set("to", e.target.value)} />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="eyebrow mb-3">Terms & attachments</legend>
        <Select label="Pre-bid EMD" value={value.prebid ?? ""} onChange={(e) => set("prebid", e.target.value as FilterValues["prebid"])}>
          <option value="">Any</option>
          <option value="required">Pre-bid EMD required</option>
          <option value="none">No pre-bid EMD</option>
        </Select>
        <Checkbox label="Catalog documents attached" checked={!!value.docs} onChange={(e) => set("docs", e.target.checked)} />
        <Checkbox label="Images available" checked={!!value.images} onChange={(e) => set("images", e.target.checked)} />
        <div className="flex items-start justify-between gap-3">
          <Checkbox
            label="Re-auctioned lots only"
            description="Unsold lots listed again, often with less competition."
            checked={!!value.reauction}
            disabled={!canReauction}
            onChange={(e) => set("reauction", e.target.checked)}
          />
          {!canReauction && (
            <a href="/pricing" className="inline-flex shrink-0 items-center gap-1 rounded-full bg-copper-soft px-2 py-0.5 text-[0.7rem] font-semibold text-copper">
              <Lock className="size-3" aria-hidden /> PRO
            </a>
          )}
        </div>
      </fieldset>
    </div>
  );
}
