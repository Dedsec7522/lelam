"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Input } from "@/components/ui/field";
import { Card } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useSession } from "@/components/session";
import { cn } from "@/lib/cn";
import { motionTokens } from "@/lib/motion";
import { api } from "../api-client";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

interface ProfileValues {
  name: string;
  company: string;
  phone: string;
  categories: string[];
  states: string[];
  keywords: string[];
  emailAlerts: boolean;
}

function groupErrors(fields: Record<string, string>) {
  // "keywords.2" → "keywords" so array issues land on the right control.
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields)) {
    const key = k.split(".")[0];
    if (!out[key]) out[key] = v;
  }
  return out;
}

export function ProfileForm({
  initial,
  categories,
  states,
}: {
  initial: ProfileValues;
  categories: { value: string; label: string }[];
  states: string[];
}) {
  const [v, setV] = useState<ProfileValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [kw, setKw] = useState("");
  const toast = useToast();
  const router = useRouter();
  const { refresh } = useSession();
  const reduce = useSafeReducedMotion();
  const formRef = useRef<HTMLFormElement>(null);

  const toggle = (key: "categories" | "states", value: string) =>
    setV((cur) => ({ ...cur, [key]: cur[key].includes(value) ? cur[key].filter((x) => x !== value) : [...cur[key], value] }));

  function addKeyword() {
    const k = kw.trim().toLowerCase();
    if (k.length < 2) return;
    setV((cur) => (cur.keywords.includes(k) || cur.keywords.length >= 15 ? cur : { ...cur, keywords: [...cur.keywords, k] }));
    setKw("");
  }

  function onKwKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKeyword();
    } else if (e.key === "Backspace" && !kw && v.keywords.length) {
      setV((cur) => ({ ...cur, keywords: cur.keywords.slice(0, -1) }));
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setStatus("");
    const pending = kw.trim().toLowerCase();
    const keywords = pending.length >= 2 && !v.keywords.includes(pending) ? [...v.keywords, pending] : v.keywords;
    const res = await api<{ user: unknown }>("/api/profile", "PATCH", { ...v, keywords });
    setSaving(false);
    if (!res.ok) {
      setErrors(groupErrors(res.fields));
      setStatus(res.error);
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());
      return;
    }
    setV((cur) => ({ ...cur, keywords }));
    setKw("");
    setStatus("Profile saved.");
    toast({ tone: "success", title: "Profile saved", description: "Your alert preferences are up to date." });
    void refresh();
    router.refresh();
  }

  return (
    <Card className="p-5 sm:p-6">
      <form ref={formRef} onSubmit={onSubmit} noValidate className="grid gap-6">
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-4 text-lg font-semibold text-ink">Your details</legend>
          <Input label="Full name" name="name" required value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} error={errors.name} autoComplete="name" />
          <Input label="Company" name="company" value={v.company} onChange={(e) => setV({ ...v, company: e.target.value })} error={errors.company} autoComplete="organization" />
          <Input
            label="Mobile number"
            name="phone"
            type="tel"
            value={v.phone}
            onChange={(e) => setV({ ...v, phone: e.target.value })}
            error={errors.phone}
            autoComplete="tel"
            placeholder="+91 98765 43210"
          />
        </fieldset>

        <fieldset>
          <legend className="text-lg font-semibold text-ink">Alert preferences</legend>
          <p className="mt-1 text-sm text-muted">We match new auctions against these and notify you.</p>

          <p className="mb-2 mt-5 text-sm font-medium text-ink-2" id="cat-label">
            Categories
          </p>
          <div role="group" aria-labelledby="cat-label" className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const on = v.categories.includes(c.value);
              return (
                <button
                  key={c.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle("categories", c.value)}
                  className={cn(
                    "min-h-11 rounded-full border px-4 text-sm font-medium transition-colors",
                    on ? "border-brand bg-brand-soft text-brand-ink" : "border-line-strong bg-surface text-ink-2 hover:border-ink/30",
                  )}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
          {errors.categories && <p role="alert" className="mt-1.5 text-[0.8rem] font-medium text-danger">{errors.categories}</p>}

          <p className="mb-2 mt-6 text-sm font-medium text-ink-2" id="state-label">
            States <span className="font-normal text-muted">({v.states.length} selected)</span>
          </p>
          <div role="group" aria-labelledby="state-label" className="grid max-h-56 grid-cols-1 gap-1 overflow-y-auto rounded-xl border border-line p-3 sm:grid-cols-2 lg:grid-cols-3">
            {states.map((s) => (
              <Checkbox key={s} label={s} checked={v.states.includes(s)} onChange={() => toggle("states", s)} className="min-h-9 items-center" />
            ))}
          </div>
          {errors.states && <p role="alert" className="mt-1.5 text-[0.8rem] font-medium text-danger">{errors.states}</p>}

          <div className="mt-6">
            <Input
              label="Keywords"
              name="keyword"
              value={kw}
              onChange={(e) => setKw(e.target.value)}
              onKeyDown={onKwKey}
              onBlur={addKeyword}
              error={errors.keywords}
              hint="Press Enter to add, e.g. copper, transformer, teak. Up to 15."
              placeholder="Add a keyword"
            />
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Your keywords">
              <AnimatePresence initial={false}>
                {v.keywords.map((k) => (
                  <motion.li
                    key={k}
                    initial={{ opacity: 0, scale: reduce ? 1 : motionTokens.scale.subtle }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: motionTokens.duration.fast }}
                    className="inline-flex items-center gap-1 rounded-full bg-paper-2 py-1 pl-3 pr-1 text-sm text-ink-2"
                  >
                    {k}
                    <button
                      type="button"
                      onClick={() => setV((cur) => ({ ...cur, keywords: cur.keywords.filter((x) => x !== k) }))}
                      className="grid size-8 place-items-center rounded-full hover:bg-surface hover:text-ink"
                      aria-label={`Remove keyword ${k}`}
                    >
                      <X className="size-3.5" />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>

          <Checkbox
            className="mt-6"
            label="Email me matching auctions"
            description="A daily digest of new auctions that match your categories, states and keywords."
            checked={v.emailAlerts}
            onChange={(e) => setV({ ...v, emailAlerts: e.target.checked })}
          />
        </fieldset>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line pt-5">
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

export function PasswordForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const toast = useToast();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setSaving(true);
    setErrors({});
    setStatus("");
    const res = await api<{ ok: true }>("/api/profile/password", "POST", {
      currentPassword: String(fd.get("currentPassword") ?? ""),
      newPassword: String(fd.get("newPassword") ?? ""),
      confirmPassword: String(fd.get("confirmPassword") ?? ""),
    });
    setSaving(false);
    if (!res.ok) {
      setErrors(res.fields);
      setStatus(res.error);
      return;
    }
    form.reset();
    setStatus("Password changed.");
    toast({ tone: "success", title: "Password changed" });
  }

  return (
    <Card className="p-5 sm:p-6">
      <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-3">
          <h2 className="text-lg font-semibold text-ink">Change password</h2>
          <p className="mt-1 text-sm text-muted">Use at least 10 characters with a letter and a number.</p>
        </div>
        <Input label="Current password" name="currentPassword" type="password" autoComplete="current-password" required error={errors.currentPassword} />
        <Input label="New password" name="newPassword" type="password" autoComplete="new-password" required error={errors.newPassword} />
        <Input label="Confirm new password" name="confirmPassword" type="password" autoComplete="new-password" required error={errors.confirmPassword} />
        <div className="flex flex-wrap items-center justify-end gap-3 sm:col-span-3">
          <p aria-live="polite" className={cn("mr-auto text-sm", Object.keys(errors).length ? "text-danger" : "text-muted")}>
            {status}
          </p>
          <Button type="submit" variant="secondary" loading={saving}>
            Update password
          </Button>
        </div>
      </form>
    </Card>
  );
}
