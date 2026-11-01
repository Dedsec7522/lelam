"use client";

import { useState } from "react";
import Link from "next/link";
import { BellRing, CheckCircle2, Circle, Pencil, Trash2 } from "lucide-react";
import { Badge, Card } from "@/components/ui/primitives";
import { Segmented } from "@/components/ui/segmented";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { CrudManager, RowAction, type FieldDef, type FieldValue } from "../crud-manager";
import { REMINDER_CHANNELS } from "../options";

export interface ReminderRow {
  id: string;
  title: string;
  remindAt: string;
  channel: (typeof REMINDER_CHANNELS)[number];
  auctionId?: string;
  done: boolean;
  createdAt: string;
}

const CHANNEL: Record<ReminderRow["channel"], string> = { email: "Email", sms: "SMS", whatsapp: "WhatsApp" };
type View = "upcoming" | "done" | "all";

export function RemindersClient({
  initial,
  options,
  titles,
  now,
  draft,
  openOnMount,
}: {
  initial: ReminderRow[];
  options: { id: string; label: string }[];
  titles: Record<string, string>;
  now: number;
  draft?: Record<string, FieldValue>;
  openOnMount?: boolean;
}) {
  const [view, setView] = useState<View>("upcoming");
  const fields: FieldDef[] = [
    { name: "title", label: "Title", type: "text", required: true, placeholder: "e.g. Pay EMD for copper lot", wide: true },
    { name: "remindAt", label: "Remind me at", type: "datetime", required: true },
    { name: "channel", label: "Channel", type: "select", options: REMINDER_CHANNELS.map((c) => ({ value: c, label: CHANNEL[c] })) },
    {
      name: "auctionId",
      label: "Auction Ref ID",
      type: "text",
      hint: "Optional. Links the reminder to an auction.",
      suggestions: options.map((o) => ({ value: o.id, label: o.label })),
      wide: true,
    },
  ];

  return (
    <CrudManager<ReminderRow>
      endpoint="/api/reminders"
      initial={initial}
      fields={fields}
      noun="reminder"
      draft={draft}
      openOnMount={openOnMount}
      filter={(r) => (view === "all" ? true : view === "done" ? r.done : !r.done)}
      sort={(a, b) => a.remindAt.localeCompare(b.remindAt)}
      toolbar={
        <Segmented<View>
          label="Filter reminders"
          size="sm"
          value={view}
          onChange={setView}
          options={[
            { value: "upcoming", label: "To do" },
            { value: "done", label: "Done" },
            { value: "all", label: "All" },
          ]}
        />
      }
      empty={{
        title: view === "done" ? "Nothing completed yet" : "No reminders",
        description: "Set reminders for inspections, EMD payment and auction closing so nothing slips.",
        icon: <BellRing className="size-5" />,
      }}
      renderItem={(r, ctl) => {
        const overdue = !r.done && Date.parse(r.remindAt) < now;
        return (
          <Card className="flex items-center gap-3 p-4 sm:p-5">
            <RowAction
              label={r.done ? "Mark as not done" : "Mark as done"}
              onClick={() => void ctl.patch({ done: !r.done }, r.done ? "Reminder reopened" : "Reminder done")}
              disabled={ctl.busy}
            >
              {r.done ? <CheckCircle2 className="size-6 text-positive" /> : <Circle className="size-6" />}
            </RowAction>
            <div className="min-w-0 flex-1">
              <p className={cn("truncate font-semibold text-ink", r.done && "text-muted line-through")}>{r.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                <time dateTime={r.remindAt} className={cn(overdue && "font-medium text-danger")}>
                  {formatDateTime(r.remindAt)}
                </time>
                <Badge>{CHANNEL[r.channel]}</Badge>
                {overdue && <Badge tone="danger">Overdue</Badge>}
                {r.auctionId && (
                  <Link href={`/auctions/${r.auctionId}`} className="truncate font-medium text-brand hover:underline">
                    Ref {r.auctionId}
                    {titles[r.auctionId] ? ` · ${titles[r.auctionId]}` : ""}
                  </Link>
                )}
              </div>
            </div>
            <div className="flex shrink-0">
              <RowAction label="Edit reminder" onClick={ctl.edit}>
                <Pencil className="size-[18px]" />
              </RowAction>
              <RowAction label="Delete reminder" tone="danger" onClick={ctl.remove}>
                <Trash2 className="size-[18px]" />
              </RowAction>
            </div>
          </Card>
        );
      }}
    />
  );
}
