"use client";

import Link from "next/link";
import { MapPin, Package, Pencil, Trash2 } from "lucide-react";
import { Card, Stat } from "@/components/ui/primitives";
import { formatINR, formatNumber } from "@/lib/format";
import { CrudManager, RowAction, type FieldDef } from "../crud-manager";
import { INVENTORY_UNITS } from "../options";

export interface InventoryRow {
  id: string;
  material: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  location: string;
  sourceAuctionId?: string;
  createdAt: string;
}

const value = (i: InventoryRow) => i.quantity * i.costPerUnit;

export function InventoryClient({ initial, options }: { initial: InventoryRow[]; options: { id: string; label: string }[] }) {
  const fields: FieldDef[] = [
    { name: "material", label: "Material", type: "text", required: true, placeholder: "e.g. HMS 1&2 melting scrap", wide: true },
    { name: "quantity", label: "Quantity", type: "number", required: true, step: "0.001", min: 0 },
    { name: "unit", label: "Unit", type: "select", options: INVENTORY_UNITS.map((u) => ({ value: u, label: u })) },
    { name: "costPerUnit", label: "Cost per unit (₹)", type: "number", required: true, step: "0.01", min: 0, hint: "Landed cost incl. GST & transport" },
    { name: "location", label: "Storage location", type: "text", required: true, placeholder: "Yard, city" },
    {
      name: "sourceAuctionId",
      label: "Source auction Ref ID",
      type: "text",
      hint: "Optional",
      suggestions: options.map((o) => ({ value: o.id, label: o.label })),
      wide: true,
    },
  ];

  return (
    <CrudManager<InventoryRow>
      endpoint="/api/inventory"
      initial={initial}
      fields={fields}
      noun="item"
      addLabel="Add stock"
      sort={(a, b) => value(b) - value(a)}
      empty={{ title: "No stock recorded", description: "Add lots you have lifted to see your stock value by material.", icon: <Package className="size-5" /> }}
      summary={(items) => {
        const total = items.reduce((s, i) => s + value(i), 0);
        const byMaterial = new Map<string, number>();
        for (const i of items) byMaterial.set(i.material, (byMaterial.get(i.material) ?? 0) + value(i));
        const top = [...byMaterial.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
        const locations = new Set(items.map((i) => i.location.toLowerCase())).size;
        return (
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Stock value" value={formatINR(total, { compact: true })} tone="copper" hint="Quantity × cost" />
              <Stat label="Lines" value={items.length} hint={`${locations} location${locations === 1 ? "" : "s"}`} />
            </div>
            <Card className="p-4">
              <p className="eyebrow mb-3 text-[0.66rem]">Value by material</p>
              <ul className="grid gap-2">
                {top.map(([name, v]) => (
                  <li key={name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 text-sm">
                    <span className="truncate text-ink-2">{name}</span>
                    <span className="font-mono tabular-nums text-ink">{formatINR(v, { compact: true })}</span>
                    <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-paper-2" aria-hidden>
                      <span className="block h-full rounded-full bg-brand" style={{ width: `${total ? (v / total) * 100 : 0}%` }} />
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        );
      }}
      renderItem={(i, ctl) => (
        <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-ink">{i.material}</p>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              <span className="font-mono tabular-nums">
                {formatNumber(i.quantity, 3)} {i.unit} × {formatINR(i.costPerUnit)}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden /> {i.location}
              </span>
              {i.sourceAuctionId && (
                <Link href={`/auctions/${i.sourceAuctionId}`} className="font-medium text-brand hover:underline">
                  From Ref {i.sourceAuctionId}
                </Link>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="font-mono text-base font-medium tabular-nums text-ink">{formatINR(value(i))}</span>
            <RowAction label="Edit item" onClick={ctl.edit}>
              <Pencil className="size-[18px]" />
            </RowAction>
            <RowAction label="Delete item" tone="danger" onClick={ctl.remove}>
              <Trash2 className="size-[18px]" />
            </RowAction>
          </div>
        </Card>
      )}
    />
  );
}
