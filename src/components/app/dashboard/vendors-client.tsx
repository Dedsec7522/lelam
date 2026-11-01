"use client";

import { useState } from "react";
import { Contact, Mail, MapPin, Pencil, Phone, Star, Trash2 } from "lucide-react";
import { Badge, Card } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { CrudManager, RowAction, type FieldDef } from "../crud-manager";
import { VENDOR_SERVICES } from "../options";

export interface VendorRow {
  id: string;
  name: string;
  service: (typeof VENDOR_SERVICES)[number];
  city: string;
  phone: string;
  email?: string;
  rating: number;
  createdAt: string;
}

const SERVICE: Record<VendorRow["service"], string> = {
  transport: "Transport",
  loading: "Loading & labour",
  recycler: "Recycler",
  buyer: "Buyer",
  other: "Other",
};

const fields: FieldDef[] = [
  { name: "name", label: "Name", type: "text", required: true, placeholder: "Business or person", wide: true },
  { name: "service", label: "Service", type: "select", options: VENDOR_SERVICES.map((s) => ({ value: s, label: SERVICE[s] })) },
  { name: "city", label: "City", type: "text", required: true },
  { name: "phone", label: "Phone", type: "tel", required: true, placeholder: "+91 98765 43210" },
  { name: "email", label: "Email", type: "email", placeholder: "Optional" },
  { name: "rating", label: "Rating (1 to 5)", type: "number", required: true, min: 1, max: 5, step: "1" },
];

type Filter = "all" | VendorRow["service"];

export function VendorsClient({ initial }: { initial: VendorRow[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  return (
    <CrudManager<VendorRow>
      endpoint="/api/vendors"
      initial={initial}
      noun="vendor"
      fields={fields}
      draft={{ rating: 4, service: "transport" }}
      filter={(v) => filter === "all" || v.service === filter}
      sort={(a, b) => b.rating - a.rating || a.name.localeCompare(b.name)}
      listClassName="sm:grid-cols-2"
      toolbar={
        <label className="flex items-center gap-2 text-sm text-muted">
          <span className="sr-only sm:not-sr-only">Show</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
            className="h-11 rounded-xl border border-line-strong bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/12"
            aria-label="Filter by service"
          >
            <option value="all">All services</option>
            {VENDOR_SERVICES.map((s) => (
              <option key={s} value={s}>
                {SERVICE[s]}
              </option>
            ))}
          </select>
        </label>
      }
      empty={{ title: "No vendors yet", description: "Save the transporters and recyclers you trust so you can call them the moment you win.", icon: <Contact className="size-5" /> }}
      renderItem={(v, ctl) => (
        <Card className="flex h-full flex-col p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{v.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                <Badge tone="brand">{SERVICE[v.service]}</Badge>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" aria-hidden /> {v.city}
                </span>
              </div>
            </div>
            <span className="flex shrink-0" aria-label={`Rated ${v.rating} of 5`} role="img">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} className={cn("size-4", n <= v.rating ? "fill-current text-copper" : "text-line-strong")} aria-hidden />
              ))}
            </span>
          </div>
          <div className="mt-auto flex items-center gap-1 pt-3">
            <a href={`tel:${v.phone.replace(/\s+/g, "")}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-medium text-brand hover:bg-paper-2">
              <Phone className="size-4" aria-hidden /> {v.phone}
            </a>
            {v.email && (
              <a href={`mailto:${v.email}`} aria-label={`Email ${v.name}`} title={v.email} className="grid size-11 place-items-center rounded-xl text-muted hover:bg-paper-2 hover:text-ink">
                <Mail className="size-[18px]" />
              </a>
            )}
            <span className="ml-auto flex">
              <RowAction label="Edit vendor" onClick={ctl.edit}>
                <Pencil className="size-[18px]" />
              </RowAction>
              <RowAction label="Delete vendor" tone="danger" onClick={ctl.remove}>
                <Trash2 className="size-[18px]" />
              </RowAction>
            </span>
          </div>
        </Card>
      )}
    />
  );
}
