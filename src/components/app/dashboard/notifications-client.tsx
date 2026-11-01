"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";
import { Segmented } from "@/components/ui/segmented";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { motionTokens, springs } from "@/lib/motion";
import { api } from "../api-client";
import { RowAction } from "../crud-manager";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

export interface NotificationRow {
  id: string;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: string;
}

type Filter = "all" | "unread";

export function NotificationsClient({ initial }: { initial: NotificationRow[] }) {
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const [busy, setBusy] = useState(false);
  const [announce, setAnnounce] = useState("");
  const toast = useToast();
  const router = useRouter();
  const reduce = useSafeReducedMotion();
  const unread = items.filter((n) => !n.read).length;
  const shown = useMemo(() => (filter === "unread" ? items.filter((n) => !n.read) : items), [items, filter]);

  async function mark(ids: string[] | "all", read = true) {
    setBusy(true);
    const res = await api<{ unread: number }>("/api/notifications", "PATCH", ids === "all" ? { all: true } : { ids, read });
    setBusy(false);
    if (!res.ok) {
      toast({ tone: "error", title: "Could not update", description: res.error });
      return;
    }
    setItems((cur) => cur.map((n) => (ids === "all" || ids.includes(n.id) ? { ...n, read } : n)));
    setAnnounce(ids === "all" ? "All notifications marked as read" : read ? "Marked as read" : "Marked as unread");
    router.refresh();
  }

  async function remove(id: string) {
    const res = await api<{ ok: true }>("/api/notifications", "DELETE", { ids: [id] });
    if (!res.ok) {
      toast({ tone: "error", title: "Could not delete", description: res.error });
      return;
    }
    setItems((cur) => cur.filter((n) => n.id !== id));
    setAnnounce("Notification deleted");
    router.refresh();
  }

  return (
    <div>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segmented<Filter>
          label="Filter notifications"
          size="sm"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: `All (${items.length})` },
            { value: "unread", label: `Unread (${unread})` },
          ]}
        />
        <Button variant="secondary" size="sm" className="min-h-11" onClick={() => mark("all")} disabled={unread === 0} loading={busy}>
          <CheckCheck className="size-4" aria-hidden /> Mark all read
        </Button>
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon={<Bell className="size-5" />}
          title={filter === "unread" ? "You are all caught up" : "No notifications yet"}
          description="Matching auctions, transport quotes and listing reviews will appear here."
        />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          <AnimatePresence initial={false}>
            {shown.map((n) => (
              <motion.li
                key={n.id}
                layout={!reduce}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: springs.gentle }}
                exit={{ opacity: 0, transition: { duration: motionTokens.duration.fast } }}
                className={cn("flex items-start gap-3 p-4 sm:p-5", !n.read && "bg-brand-soft/40")}
              >
                <span className={cn("mt-2 size-2 shrink-0 rounded-full", n.read ? "bg-line-strong" : "bg-copper")} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm text-ink", !n.read && "font-semibold")}>
                    {n.title}
                    {!n.read && <span className="sr-only"> (unread)</span>}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">{n.body}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-faint">
                    <time dateTime={n.createdAt}>{formatDateTime(n.createdAt)}</time>
                    {n.href && (
                      <Link
                        href={n.href}
                        onClick={() => !n.read && void mark([n.id])}
                        className="font-medium text-brand hover:underline"
                      >
                        Open
                      </Link>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0">
                  <RowAction label={n.read ? "Mark as unread" : "Mark as read"} onClick={() => mark([n.id], !n.read)}>
                    <Check className={cn("size-[18px]", n.read && "text-positive")} />
                  </RowAction>
                  <RowAction label="Delete notification" tone="danger" onClick={() => remove(n.id)}>
                    <Trash2 className="size-[18px]" />
                  </RowAction>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
