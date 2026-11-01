"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { motionTokens, springs } from "@/lib/motion";
import { api, fromLocalInput, toLocalInput } from "./api-client";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

export type FieldValue = string | number | boolean | undefined;

export interface FieldDef {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "datetime" | "select" | "textarea" | "checkbox" | "email" | "tel" | "file";
  options?: readonly { value: string; label: string }[];
  required?: boolean;
  hint?: string;
  placeholder?: string;
  step?: string;
  min?: number;
  max?: number;
  /** Datalist suggestions (e.g. watchlisted auctions). */
  suggestions?: readonly { value: string; label: string }[];
  /** Only shown when creating (e.g. file upload). */
  createOnly?: boolean;
  /** Span both columns of the form grid. */
  wide?: boolean;
  accept?: string;
}

export interface ItemControls<T> {
  edit: () => void;
  remove: () => void;
  /** Partial update; returns true on success. */
  patch: (body: Record<string, unknown>, success?: string) => Promise<boolean>;
  busy: boolean;
  /** Replace the item locally after a custom API call. */
  replace: (next: T) => void;
}

interface Props<T extends { id: string }> {
  endpoint: string;
  initial: T[];
  fields: FieldDef[];
  /** Singular noun for copy, e.g. "vendor". */
  noun: string;
  renderItem: (item: T, ctl: ItemControls<T>) => ReactNode;
  summary?: (items: T[]) => ReactNode;
  empty: { title: string; description: string; icon?: ReactNode };
  sort?: (a: T, b: T) => number;
  multipart?: boolean;
  toForm?: (item: T) => Record<string, FieldValue>;
  /** Values for a new record (e.g. from query-string prefill). */
  draft?: Record<string, FieldValue>;
  openOnMount?: boolean;
  addLabel?: string;
  toolbar?: ReactNode;
  filter?: (item: T) => boolean;
  listClassName?: string;
}

type Mode = { kind: "closed" } | { kind: "create" } | { kind: "edit"; id: string };

/**
 * Generic list + dialog form for a per-user collection API
 * (`GET/POST endpoint`, `PATCH/DELETE endpoint/:id`). Server field errors render inline.
 */
export function CrudManager<T extends { id: string }>({
  endpoint,
  initial,
  fields,
  noun,
  renderItem,
  summary,
  empty,
  sort,
  multipart,
  toForm,
  draft,
  openOnMount,
  addLabel,
  toolbar,
  filter,
  listClassName,
}: Props<T>) {
  const [items, setItems] = useState<T[]>(initial);
  const [mode, setMode] = useState<Mode>(openOnMount ? { kind: "create" } : { kind: "closed" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<T | null>(null);
  const [announce, setAnnounce] = useState("");
  const toast = useToast();
  const router = useRouter();
  const reduce = useSafeReducedMotion();
  const formRef = useRef<HTMLFormElement>(null);

  const sorted = useMemo(() => {
    const list = filter ? items.filter(filter) : items;
    return sort ? [...list].sort(sort) : list;
  }, [items, sort, filter]);

  const editing = mode.kind === "edit" ? items.find((i) => i.id === mode.id) : undefined;
  const close = useCallback(() => {
    setMode({ kind: "closed" });
    setErrors({});
    setFormError(null);
  }, []);

  useEffect(() => {
    if (announce) {
      const t = window.setTimeout(() => setAnnounce(""), 4000);
      return () => window.clearTimeout(t);
    }
  }, [announce]);

  function defaults(): Record<string, FieldValue> {
    if (editing) {
      const raw = toForm ? toForm(editing) : (editing as unknown as Record<string, FieldValue>);
      return raw;
    }
    return draft ?? {};
  }

  function readForm(form: HTMLFormElement): Record<string, unknown> | FormData {
    const fd = new FormData(form);
    const active = fields.filter((f) => !(f.createOnly && mode.kind === "edit"));
    const out: Record<string, unknown> = {};
    for (const f of active) {
      if (f.type === "file") continue;
      const raw = fd.get(f.name);
      const v = typeof raw === "string" ? raw : "";
      if (f.type === "number") out[f.name] = v.trim() === "" ? undefined : Number(v);
      else if (f.type === "checkbox") out[f.name] = raw === "on";
      else if (f.type === "datetime") out[f.name] = fromLocalInput(v);
      else out[f.name] = v;
    }
    if (multipart && mode.kind === "create") {
      const body = new FormData();
      for (const [k, v] of Object.entries(out)) if (v !== undefined) body.set(k, String(v));
      for (const f of active.filter((x) => x.type === "file")) {
        const file = fd.get(f.name);
        if (file instanceof File && file.size > 0) body.set(f.name, file);
      }
      return body;
    }
    return out;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setFormError(null);
    const body = readForm(e.currentTarget);
    const res =
      mode.kind === "edit"
        ? await api<{ item: T }>(`${endpoint}/${mode.id}`, "PATCH", body)
        : await api<{ item: T }>(endpoint, "POST", body);
    setSaving(false);
    if (!res.ok) {
      setErrors(res.fields);
      setFormError(res.error);
      // Move focus to the first invalid control for keyboard and screen-reader users.
      window.requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());
      return;
    }
    const item = res.data.item;
    setItems((cur) => (mode.kind === "edit" ? cur.map((i) => (i.id === item.id ? item : i)) : [item, ...cur]));
    const msg = mode.kind === "edit" ? `${capital(noun)} updated` : `${capital(noun)} added`;
    toast({ tone: "success", title: msg });
    setAnnounce(msg);
    close();
    router.refresh();
  }

  async function doDelete(item: T) {
    setBusyId(item.id);
    const res = await api<{ ok: true }>(`${endpoint}/${item.id}`, "DELETE");
    setBusyId(null);
    setConfirm(null);
    if (!res.ok) {
      toast({ tone: "error", title: "Could not delete", description: res.error });
      return;
    }
    setItems((cur) => cur.filter((i) => i.id !== item.id));
    toast({ tone: "success", title: `${capital(noun)} deleted` });
    setAnnounce(`${capital(noun)} deleted`);
    router.refresh();
  }

  const controls = (item: T): ItemControls<T> => ({
    busy: busyId === item.id,
    edit: () => setMode({ kind: "edit", id: item.id }),
    remove: () => setConfirm(item),
    replace: (next) => setItems((cur) => cur.map((i) => (i.id === next.id ? next : i))),
    patch: async (body, success) => {
      setBusyId(item.id);
      const res = await api<{ item: T }>(`${endpoint}/${item.id}`, "PATCH", body);
      setBusyId(null);
      if (!res.ok) {
        toast({ tone: "error", title: "Could not update", description: res.error });
        return false;
      }
      setItems((cur) => cur.map((i) => (i.id === item.id ? res.data.item : i)));
      if (success) {
        toast({ tone: "success", title: success });
        setAnnounce(success);
      }
      router.refresh();
      return true;
    },
  });

  const values = mode.kind === "closed" ? {} : defaults();
  const open = mode.kind !== "closed";

  return (
    <div>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      {summary && items.length > 0 && <div className="mb-6">{summary(items)}</div>}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {sorted.length} {sorted.length === 1 ? noun : `${noun}s`}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {toolbar}
          <Button onClick={() => setMode({ kind: "create" })} size="md">
            <Plus className="size-4" aria-hidden /> {addLabel ?? `Add ${noun}`}
          </Button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={empty.icon}
          title={empty.title}
          description={empty.description}
          action={
            <Button variant="secondary" onClick={() => setMode({ kind: "create" })}>
              <Plus className="size-4" aria-hidden /> {addLabel ?? `Add ${noun}`}
            </Button>
          }
        />
      ) : (
        <ul className={cn("grid gap-3", listClassName)}>
          <AnimatePresence initial={false}>
            {sorted.map((item, i) => (
              <motion.li
                key={item.id}
                layout={!reduce}
                initial={{ opacity: 0, y: reduce ? 0 : motionTokens.distance.sm }}
                animate={{ opacity: 1, y: 0, transition: { ...springs.gentle, delay: Math.min(i, 8) * motionTokens.stagger.tight } }}
                exit={{ opacity: 0, scale: reduce ? 1 : motionTokens.scale.subtle, transition: { duration: motionTokens.duration.fast } }}
                className="min-w-0"
              >
                {renderItem(item, controls(item))}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <Dialog
        open={open}
        onClose={close}
        title={mode.kind === "edit" ? `Edit ${noun}` : addLabel ?? `Add ${noun}`}
        description={mode.kind === "edit" ? "Changes save to your workspace." : undefined}
      >
        <form
          ref={formRef}
          key={mode.kind === "edit" ? mode.id : "new"}
          onSubmit={onSubmit}
          noValidate
          className="grid gap-4 px-6 py-5 sm:grid-cols-2"
        >
          {fields
            .filter((f) => !(f.createOnly && mode.kind === "edit"))
            .map((f) => (
              <FormField key={f.name} field={f} value={values[f.name]} error={errors[f.name]} />
            ))}
          {formError && Object.keys(errors).length === 0 && (
            <p role="alert" className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger sm:col-span-2">
              {formError}
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 pt-2 sm:col-span-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {mode.kind === "edit" ? "Save changes" : `Save ${noun}`}
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={confirm !== null}
        title={`Delete this ${noun}?`}
        description="This cannot be undone."
        confirmLabel="Delete"
        busy={confirm !== null && busyId === confirm.id}
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm && doDelete(confirm)}
      />
    </div>
  );
}

function FormField({ field: f, value, error }: { field: FieldDef; value: FieldValue; error?: string }) {
  const cls = f.wide || f.type === "textarea" || f.type === "file" ? "sm:col-span-2" : undefined;
  const str = value === undefined || value === null ? "" : String(value);
  if (f.type === "select") {
    return (
      <Select label={f.label} name={f.name} defaultValue={str || f.options?.[0]?.value} required={f.required} error={error} hint={f.hint} className={cls}>
        {f.options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    );
  }
  if (f.type === "textarea") {
    return <Textarea label={f.label} name={f.name} defaultValue={str} required={f.required} error={error} hint={f.hint} placeholder={f.placeholder} className={cls} />;
  }
  if (f.type === "checkbox") {
    return <Checkbox label={f.label} name={f.name} defaultChecked={value === true} description={f.hint} className={cn("min-h-11 items-center", cls)} />;
  }
  const listId = f.suggestions ? `dl-${f.name}` : undefined;
  return (
    <div className={cls}>
      <Input
        label={f.label}
        name={f.name}
        type={f.type === "datetime" ? "datetime-local" : f.type}
        defaultValue={f.type === "file" ? undefined : f.type === "datetime" ? toLocalInput(str) : str}
        required={f.required}
        error={error}
        hint={f.hint}
        placeholder={f.placeholder}
        step={f.step}
        min={f.min}
        max={f.max}
        list={listId}
        accept={f.accept}
        inputMode={f.type === "number" ? "decimal" : undefined}
      />
      {f.suggestions && (
        <datalist id={listId}>
          {f.suggestions.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </datalist>
      )}
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  busy,
  onCancel,
  onConfirm,
  tone = "danger",
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  tone?: "danger" | "primary";
}) {
  return (
    <Dialog open={open} onClose={onCancel} title={title} description={description} size="sm">
      <div className="flex flex-col-reverse gap-2 px-6 py-5 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onCancel} data-autofocus>
          Cancel
        </Button>
        <Button variant={tone} onClick={onConfirm} loading={busy}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}

/** Icon button used on list rows (≥ 44px touch target). */
export function RowAction({ label, onClick, children, tone, disabled }: { label: string; onClick: () => void; children: ReactNode; tone?: "danger"; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-xl text-muted transition-colors hover:bg-paper-2 hover:text-ink disabled:opacity-50",
        tone === "danger" && "hover:bg-danger-soft hover:text-danger",
      )}
    >
      {children}
    </button>
  );
}

function capital(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
