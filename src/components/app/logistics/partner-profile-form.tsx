"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox, Input } from "@/components/ui/field";
import { Card } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useSession } from "@/components/session";
import { cn } from "@/lib/cn";
import { api } from "../api-client";

interface Values {
  name: string;
  company: string;
  phone: string;
  categories: string[];
  states: string[];
  keywords: string[];
  emailAlerts: boolean;
}

/** Logistics partner details; "states" doubles as the partner's service area. */
export function PartnerProfileForm({ initial, states }: { initial: Values; states: string[] }) {
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const router = useRouter();
  const { refresh } = useSession();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setStatus("");
    const res = await api<{ user: unknown }>("/api/profile", "PATCH", v);
    setSaving(false);
    if (!res.ok) {
      setErrors(res.fields);
      setStatus(res.error);
      return;
    }
    setStatus("Saved.");
    toast({ tone: "success", title: "Company profile saved" });
    void refresh();
    router.refresh();
  }

  const toggleState = (s: string) => setV((cur) => ({ ...cur, states: cur.states.includes(s) ? cur.states.filter((x) => x !== s) : [...cur.states, s] }));

  return (
    <Card className="p-5 sm:p-6">
      <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Input label="Company name" required value={v.company} onChange={(e) => setV({ ...v, company: e.target.value })} error={errors.company} autoComplete="organization" />
        <Input label="Contact person" required value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} error={errors.name} autoComplete="name" />
        <Input label="Dispatch phone" type="tel" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} error={errors.phone} autoComplete="tel" />
        <div className="sm:col-span-2">
          <p className="mb-2 text-sm font-medium text-ink-2" id="area-label">
            Service area <span className="font-normal text-muted">({v.states.length} states)</span>
          </p>
          <div role="group" aria-labelledby="area-label" className="grid max-h-56 grid-cols-1 gap-1 overflow-y-auto rounded-xl border border-line p-3 sm:grid-cols-2 lg:grid-cols-3">
            {states.map((s) => (
              <Checkbox key={s} label={s} checked={v.states.includes(s)} onChange={() => toggleState(s)} className="min-h-9 items-center" />
            ))}
          </div>
        </div>
        <Checkbox
          className="sm:col-span-2"
          label="Email me new requests in my service area"
          checked={v.emailAlerts}
          onChange={(e) => setV({ ...v, emailAlerts: e.target.checked })}
        />
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line pt-5 sm:col-span-2">
          <p aria-live="polite" className={cn("mr-auto text-sm", Object.keys(errors).length ? "text-danger" : "text-muted")}>
            {status}
          </p>
          <Button type="submit" loading={saving}>
            Save profile
          </Button>
        </div>
      </form>
    </Card>
  );
}
