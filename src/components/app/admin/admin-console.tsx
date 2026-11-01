"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Check, ClipboardList, History, Inbox, Mail, Phone, Search, Store, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Badge, Card, EmptyState, Stat } from "@/components/ui/primitives";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { PLAN_BY_ID } from "@/lib/plans";
import { formatDate, formatDateTime, formatINR } from "@/lib/format";
import { fadeOnly, fadeUp } from "@/lib/motion";
import type { PlanId, Role } from "@/lib/types";
import { api } from "../api-client";
import { PLAN_IDS, ROLES } from "../options";
import { ListingStatusBadge, type ListingStatus } from "../seller/listing-status";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  company?: string;
  role: Role;
  plan: PlanId;
  createdAt: string;
}

export interface AdminLead {
  id: string;
  kind: "contact" | "sales";
  name: string;
  email: string;
  phone?: string;
  company?: string;
  topic?: string;
  subject?: string;
  message: string;
  createdAt: string;
}

export interface AdminListing {
  id: string;
  title: string;
  category: string;
  city: string;
  state: string;
  startsAt: string;
  reservePrice: number;
  emdPercent: number;
  description: string;
  status: ListingStatus;
  sellerEmail: string;
  createdAt: string;
}

export interface AdminAudit {
  id: string;
  action: string;
  actorEmail: string;
  meta?: Record<string, string>;
  createdAt: string;
}

type Tab = "users" | "leads" | "listings" | "audit";

const selectCls =
  "h-11 rounded-xl border border-line-strong bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/12 disabled:opacity-60";

export function AdminConsole({
  selfId,
  users: initialUsers,
  leads,
  listings: initialListings,
  audit,
  subscriptions,
}: {
  selfId: string;
  users: AdminUser[];
  leads: AdminLead[];
  listings: AdminListing[];
  audit: AdminAudit[];
  subscriptions: number;
}) {
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState(initialUsers);
  const [listings, setListings] = useState(initialListings);
  const [q, setQ] = useState("");
  const [leadKind, setLeadKind] = useState<"all" | "contact" | "sales">("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const toast = useToast();
  const router = useRouter();
  const reduce = useSafeReducedMotion();

  const pending = listings.filter((l) => l.status === "pending").length;
  const paid = users.filter((u) => u.plan !== "free").length;

  const filteredUsers = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? users.filter((u) => `${u.name} ${u.email} ${u.company ?? ""}`.toLowerCase().includes(s)) : users;
  }, [users, q]);

  async function updateUser(u: AdminUser, patch: { role?: Role; plan?: PlanId }) {
    setBusy(u.id);
    const res = await api<{ user: AdminUser }>("/api/admin/users", "PATCH", { userId: u.id, ...patch });
    setBusy(null);
    if (!res.ok) {
      toast({ tone: "error", title: "Update failed", description: res.fields.role ?? res.error });
      return;
    }
    setUsers((cur) => cur.map((x) => (x.id === u.id ? { ...x, role: res.data.user.role, plan: res.data.user.plan } : x)));
    const msg = `Updated ${u.email}`;
    toast({ tone: "success", title: msg });
    setAnnounce(msg);
    router.refresh();
  }

  async function review(l: AdminListing, action: "approve" | "reject") {
    setBusy(l.id);
    const res = await api<{ item: { status: ListingStatus } }>("/api/admin/listings", "PATCH", { id: l.id, action });
    setBusy(null);
    if (!res.ok) {
      toast({ tone: "error", title: "Review failed", description: res.error });
      return;
    }
    setListings((cur) => cur.map((x) => (x.id === l.id ? { ...x, status: res.data.item.status } : x)));
    const msg = action === "approve" ? "Listing published" : "Listing returned to draft";
    toast({ tone: "success", title: msg, description: "The seller has been notified." });
    setAnnounce(msg);
    router.refresh();
  }

  const shownLeads = leads.filter((l) => leadKind === "all" || l.kind === leadKind);

  return (
    <div>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Users" value={users.length} hint={`${paid} on paid plans`} />
        <Stat label="Subscriptions" value={subscriptions} />
        <Stat label="Leads" value={leads.length} hint={`${leads.filter((l) => l.kind === "sales").length} sales`} />
        <Stat label="Listings in review" value={pending} tone={pending ? "copper" : undefined} />
      </div>

      <div className="-mx-4 mb-6 overflow-x-auto px-4 [scrollbar-width:none]">
        <Segmented<Tab>
          label="Admin sections"
          controls="admin-tab"
          value={tab}
          onChange={setTab}
          options={[
            { value: "users", label: <><Users className="size-4" aria-hidden /> Users</> },
            { value: "leads", label: <><Inbox className="size-4" aria-hidden /> Leads</> },
            { value: "listings", label: <><Store className="size-4" aria-hidden /> Listings{pending ? ` (${pending})` : ""}</> },
            { value: "audit", label: <><History className="size-4" aria-hidden /> Audit log</> },
          ]}
        />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          id={`admin-tab-${tab}`}
          role="tabpanel"
          variants={reduce ? fadeOnly : fadeUp}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          {tab === "users" && (
            <div>
              <Input
                label="Search users"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Name, email or company"
                leading={<Search className="size-4" />}
                className="mb-4 max-w-md"
              />
              {filteredUsers.length === 0 ? (
                <EmptyState icon={<Users className="size-5" />} title="No users match" />
              ) : (
                <ul className="grid gap-2">
                  {filteredUsers.map((u) => (
                    <li key={u.id}>
                      <Card className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-ink">
                            {u.name} {u.id === selfId && <Badge tone="brand">You</Badge>}
                          </p>
                          <p className="truncate text-sm text-muted">
                            {u.email}
                            {u.company && ` · ${u.company}`} · joined {formatDate(u.createdAt)}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 md:flex">
                          <label className="sr-only" htmlFor={`role-${u.id}`}>
                            Role for {u.email}
                          </label>
                          <select
                            id={`role-${u.id}`}
                            className={selectCls}
                            value={u.role}
                            disabled={busy === u.id || u.id === selfId}
                            onChange={(e) => void updateUser(u, { role: e.target.value as Role })}
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>
                                {r.charAt(0).toUpperCase() + r.slice(1)}
                              </option>
                            ))}
                          </select>
                          <label className="sr-only" htmlFor={`plan-${u.id}`}>
                            Plan for {u.email}
                          </label>
                          <select
                            id={`plan-${u.id}`}
                            className={selectCls}
                            value={u.plan}
                            disabled={busy === u.id}
                            onChange={(e) => void updateUser(u, { plan: e.target.value as PlanId })}
                          >
                            {PLAN_IDS.map((p) => (
                              <option key={p} value={p}>
                                {PLAN_BY_ID[p].name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === "leads" && (
            <div>
              <Segmented<"all" | "contact" | "sales">
                label="Lead type"
                size="sm"
                className="mb-4"
                value={leadKind}
                onChange={setLeadKind}
                options={[
                  { value: "all", label: "All" },
                  { value: "contact", label: "Contact" },
                  { value: "sales", label: "Sales" },
                ]}
              />
              {shownLeads.length === 0 ? (
                <EmptyState icon={<Inbox className="size-5" />} title="No leads yet" description="Contact and sales form submissions land here." />
              ) : (
                <ul className="grid gap-3">
                  {shownLeads.map((l) => (
                    <li key={l.id}>
                      <Card className="p-4 sm:p-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={l.kind === "sales" ? "copper" : "neutral"}>{l.kind === "sales" ? "Sales" : "Contact"}</Badge>
                          {l.topic && <Badge>{l.topic}</Badge>}
                          <span className="text-xs text-muted">{formatDateTime(l.createdAt)}</span>
                        </div>
                        <p className="mt-2 font-semibold text-ink">
                          {l.subject ?? l.name}
                          {l.company && <span className="font-normal text-muted"> · {l.company}</span>}
                        </p>
                        {l.message && <p className="mt-1 whitespace-pre-line text-sm text-ink-2">{l.message}</p>}
                        <div className="mt-2 flex flex-wrap gap-1">
                          <a href={`mailto:${l.email}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-medium text-brand hover:bg-paper-2">
                            <Mail className="size-4" aria-hidden /> {l.name} &lt;{l.email}&gt;
                          </a>
                          {l.phone && (
                            <a href={`tel:${l.phone.replace(/\s+/g, "")}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-medium text-brand hover:bg-paper-2">
                              <Phone className="size-4" aria-hidden /> {l.phone}
                            </a>
                          )}
                        </div>
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === "listings" && (
            <div>
              {listings.length === 0 ? (
                <EmptyState icon={<ClipboardList className="size-5" />} title="No seller listings" description="Listings submitted from the seller portal appear here for review." />
              ) : (
                <ul className="grid gap-3">
                  {[...listings]
                    .sort((a, b) => Number(b.status === "pending") - Number(a.status === "pending"))
                    .map((l) => (
                      <li key={l.id}>
                        <Card className="flex flex-col gap-3 p-4 sm:p-5 md:flex-row md:items-start">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <ListingStatusBadge status={l.status} />
                              <span className="text-xs text-muted">
                                {l.sellerEmail} · submitted {formatDate(l.createdAt)}
                              </span>
                            </div>
                            <p className="mt-2 font-semibold text-ink">{l.title}</p>
                            <p className="text-sm text-muted">
                              {l.category} · {l.city}, {l.state} · reserve {formatINR(l.reservePrice)} · EMD {l.emdPercent}% · opens {formatDateTime(l.startsAt)}
                            </p>
                            <p className="mt-1 line-clamp-3 text-sm text-ink-2">{l.description}</p>
                          </div>
                          <div className="flex gap-2 self-end md:self-start">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="min-h-11"
                              disabled={busy === l.id || l.status === "draft"}
                              onClick={() => void review(l, "reject")}
                            >
                              <X className="size-4" aria-hidden /> Reject
                            </Button>
                            <Button size="sm" className="min-h-11" loading={busy === l.id} disabled={l.status === "published"} onClick={() => void review(l, "approve")}>
                              <Check className="size-4" aria-hidden /> Publish
                            </Button>
                          </div>
                        </Card>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          )}

          {tab === "audit" && (
            <Card className="overflow-hidden">
              {audit.length === 0 ? (
                <div className="p-6">
                  <EmptyState icon={<History className="size-5" />} title="No activity yet" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <caption className="sr-only">Latest 100 audit events</caption>
                    <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
                      <tr>
                        <th scope="col" className="px-4 py-3 font-medium">When</th>
                        <th scope="col" className="px-4 py-3 font-medium">Action</th>
                        <th scope="col" className="px-4 py-3 font-medium">Actor</th>
                        <th scope="col" className="px-4 py-3 font-medium">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {audit.map((a) => (
                        <tr key={a.id}>
                          <td className="whitespace-nowrap px-4 py-2.5 text-muted">{formatDateTime(a.createdAt)}</td>
                          <td className="px-4 py-2.5 font-mono text-xs text-ink">{a.action}</td>
                          <td className="max-w-[200px] truncate px-4 py-2.5 text-ink-2">{a.actorEmail}</td>
                          <td className="px-4 py-2.5 font-mono text-xs text-muted">
                            {a.meta ? Object.entries(a.meta).map(([k, v]) => `${k}=${v}`).join("  ") : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
