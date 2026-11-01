"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field";
import { Card } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { api, fromLocalInput, toLocalInput } from "../api-client";
import { ConfirmDialog } from "../crud-manager";

export interface ListingValues {
  id?: string;
  title: string;
  category: string;
  city: string;
  state: string;
  startsAt: string;
  endsAt: string;
  reservePrice?: number;
  emdPercent: number;
  description: string;
  status?: "draft" | "pending" | "published";
}

export function ListingForm({
  initial,
  categories,
  states,
  isAdmin,
}: {
  initial: ListingValues;
  categories: { value: string; label: string }[];
  states: string[];
  isAdmin?: boolean;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();
  const router = useRouter();
  const editing = Boolean(initial.id);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const str = (k: string) => String(fd.get(k) ?? "");
    const n = (k: string) => (str(k).trim() === "" ? undefined : Number(str(k)));
    const body = {
      title: str("title"),
      category: str("category"),
      city: str("city"),
      state: str("state"),
      startsAt: fromLocalInput(str("startsAt")),
      endsAt: fromLocalInput(str("endsAt")),
      reservePrice: n("reservePrice"),
      emdPercent: n("emdPercent"),
      description: str("description"),
    };
    setSaving(true);
    setErrors({});
    setFormError("");
    const res = editing
      ? await api<{ item: { id: string } }>(`/api/seller/auctions/${initial.id}`, "PATCH", body)
      : await api<{ item: { id: string } }>("/api/seller/auctions", "POST", body);
    setSaving(false);
    if (!res.ok) {
      setErrors(res.fields);
      setFormError(res.error);
      requestAnimationFrame(() => document.querySelector<HTMLElement>("#listing-form [aria-invalid=true]")?.focus());
      return;
    }
    toast({
      tone: "success",
      title: editing ? "Listing updated" : "Listing submitted",
      description: isAdmin && editing ? undefined : "Our team will review it before it goes live.",
    });
    router.push("/seller/auctions");
    router.refresh();
  }

  async function remove() {
    setDeleting(true);
    const res = await api<{ ok: true }>(`/api/seller/auctions/${initial.id}`, "DELETE");
    setDeleting(false);
    if (!res.ok) {
      toast({ tone: "error", title: "Could not delete", description: res.error });
      return;
    }
    toast({ tone: "success", title: "Listing deleted" });
    router.push("/seller/auctions");
    router.refresh();
  }

  return (
    <Card className="p-5 sm:p-6">
      <form id="listing-form" onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Input label="Title" name="title" required defaultValue={initial.title} error={errors.title} className="sm:col-span-2" placeholder="e.g. 120 MT HMS 1&2 melting scrap" />
        <Select label="Category" name="category" required defaultValue={initial.category} error={errors.category}>
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
        <Input label="City" name="city" required defaultValue={initial.city} error={errors.city} autoComplete="address-level2" />
        <div>
          <Input label="State" name="state" required defaultValue={initial.state} error={errors.state} list="listing-states" />
          <datalist id="listing-states">
            {states.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <Input
          label="Reserve price (₹)"
          name="reservePrice"
          type="number"
          inputMode="decimal"
          min={1}
          required
          defaultValue={initial.reservePrice ?? ""}
          error={errors.reservePrice}
        />
        <Input label="Opens" name="startsAt" type="datetime-local" required defaultValue={toLocalInput(initial.startsAt)} error={errors.startsAt} />
        <Input label="Closes" name="endsAt" type="datetime-local" required defaultValue={toLocalInput(initial.endsAt)} error={errors.endsAt} />
        <Input
          label="EMD %"
          name="emdPercent"
          type="number"
          inputMode="decimal"
          min={0}
          max={50}
          step="0.5"
          required
          defaultValue={initial.emdPercent}
          error={errors.emdPercent}
          hint="Earnest money deposit as % of bid value"
        />
        <Textarea
          label="Description"
          name="description"
          required
          defaultValue={initial.description}
          error={errors.description}
          className="sm:col-span-2"
          hint="Lot details, quantity, condition, inspection address and lifting terms."
        />
        {formError && Object.keys(errors).length === 0 && (
          <p role="alert" className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger sm:col-span-2">
            {formError}
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 border-t border-line pt-5 sm:col-span-2 sm:flex-row sm:items-center">
          {editing && (
            <Button variant="ghost" className="text-danger hover:bg-danger-soft hover:text-danger" onClick={() => setConfirm(true)}>
              <Trash2 className="size-4" aria-hidden /> Delete
            </Button>
          )}
          <span className="hidden flex-1 sm:block" />
          <Link href="/seller/auctions" className="inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-medium text-muted hover:bg-paper-2 hover:text-ink">
            Cancel
          </Link>
          <Button type="submit" loading={saving}>
            {editing ? (isAdmin ? "Save changes" : "Save & resubmit for review") : "Submit for review"}
          </Button>
        </div>
      </form>
      <ConfirmDialog
        open={confirm}
        title="Delete this listing?"
        description="Buyers will no longer see it. This cannot be undone."
        confirmLabel="Delete listing"
        busy={deleting}
        onCancel={() => setConfirm(false)}
        onConfirm={() => void remove()}
      />
    </Card>
  );
}
