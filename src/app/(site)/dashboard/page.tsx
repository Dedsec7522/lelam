import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Bell, Bookmark, CalendarClock, Gavel, ReceiptText, Search, Truck, UserCog } from "lucide-react";
import { requireUser } from "@/server/session";
import { read } from "@/server/store";
import { hasFeature, watchlistFor, requestTime } from "@/server/workspace";
import { PageHeader } from "@/components/app/page-header";
import { Badge, Card, EmptyState } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { AuctionStatus } from "@/components/ui/countdown";
import { CountUp } from "@/components/motion/count-up";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { PLAN_BY_ID, WATCHLIST_LIMIT } from "@/lib/plans";
import { formatDate, formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardOverview() {
  const user = await requireUser("/dashboard");
  const now = requestTime();
  const [watched, data] = await Promise.all([
    watchlistFor(user.id),
    read((db) => ({
      notifications: db.notifications
        .filter((n) => n.userId === user.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
      unread: db.notifications.filter((n) => n.userId === user.id && !n.read).length,
      bids: db.bids.filter((b) => b.userId === user.id),
      reminders: db.reminders
        .filter((r) => r.userId === user.id && !r.done && Date.parse(r.remindAt) >= now)
        .sort((a, b) => a.remindAt.localeCompare(b.remindAt))
        .slice(0, 3),
      openShipping: db.shippingRequests.filter((s) => s.userId === user.id && (s.status === "open" || s.status === "quoted")).length,
    })),
  ]);

  const upcoming = watched
    .filter((w) => w.auction && Date.parse(w.auction.endsAt) > now)
    .sort((a, b) => Date.parse(a.auction!.startsAt) - Date.parse(b.auction!.startsAt))
    .slice(0, 5);
  const plan = PLAN_BY_ID[user.plan];
  const limit = WATCHLIST_LIMIT[user.plan];
  const won = data.bids.filter((b) => b.status === "won").length;
  const firstName = user.name.split(" ")[0];

  const quick = [
    { href: "/auctions", label: "Find auctions", icon: Search },
    { href: "/dashboard/bids", label: "Log a bid", icon: Gavel },
    { href: "/dashboard/reminders", label: "Add reminder", icon: CalendarClock, locked: !hasFeature(user, "reminders") },
    { href: "/dashboard/quotes/new", label: "New quote", icon: ReceiptText, locked: !hasFeature(user, "quoteBuilder") },
    { href: "/dashboard/shipping-requests?new=1", label: "Request transport", icon: Truck, locked: !hasFeature(user, "logisticsQuotes") },
    { href: "/dashboard/profile", label: "Alert preferences", icon: UserCog },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title={`Welcome back, ${firstName}`}
        description="Your watchlist, bids and alerts at a glance."
        action={
          <ButtonLink href="/auctions" variant="secondary">
            <Search className="size-4" aria-hidden /> Browse auctions
          </ButtonLink>
        }
      />

      <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Watchlist", value: watched.length, hint: Number.isFinite(limit) ? `of ${limit} on ${plan.name}` : "Unlimited" },
          { label: "Bids logged", value: data.bids.length, hint: `${won} won` },
          { label: "Unread alerts", value: data.unread, hint: "Notifications" },
          { label: "Open transport", value: data.openShipping, hint: "Requests awaiting a decision" },
        ].map((s) => (
          <StaggerItem key={s.label} className="rounded-xl border border-line bg-surface-2 p-4">
            <p className="eyebrow text-[0.66rem]">{s.label}</p>
            <p className="mt-1.5 font-mono text-2xl font-medium tabular-nums text-ink">
              <CountUp value={s.value} />
            </p>
            <p className="mt-1 text-xs text-muted">{s.hint}</p>
          </StaggerItem>
        ))}
      </Stagger>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-ink">Upcoming in your watchlist</h2>
            <Link href="/dashboard/interested" className="inline-flex min-h-11 items-center text-sm font-medium text-brand hover:underline">
              View all
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState
              icon={<Bookmark className="size-5" />}
              title="Nothing on your radar yet"
              description="Save auctions from search to track their opening and closing times here."
              action={<ButtonLink href="/auctions" size="sm">Find auctions</ButtonLink>}
            />
          ) : (
            <ul className="divide-y divide-line">
              {upcoming.map(({ auction: a }) => (
                <li key={a!.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <Link href={`/auctions/${a!.id}`} className="block truncate font-medium text-ink hover:text-brand">
                      {a!.title}
                    </Link>
                    <p className="truncate text-xs text-muted">
                      {a!.city}, {a!.state} · Ref {a!.id} · opens {formatDateTime(a!.startsAt)}
                    </p>
                  </div>
                  <AuctionStatus startsAt={a!.startsAt} endsAt={a!.endsAt} compact />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="grid content-start gap-6">
          <Card className="p-5 sm:p-6">
            <p className="eyebrow text-[0.66rem]">Your plan</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xl font-semibold text-ink">{plan.name}</p>
              <Badge tone={user.plan === "free" ? "neutral" : "positive"}>{user.plan === "free" ? "Free forever" : "Active"}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted">
              {user.planRenewsAt ? `Renews ${formatDate(user.planRenewsAt)}` : plan.tagline}
            </p>
            {user.plan !== "enterprise" && (
              <ButtonLink href="/pricing" variant={user.plan === "free" ? "primary" : "secondary"} size="sm" className="mt-4">
                {user.plan === "free" ? "Upgrade plan" : "Compare plans"}
              </ButtonLink>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-ink">Recent alerts</h2>
              <Link href="/dashboard/notifications" className="inline-flex min-h-11 items-center text-sm font-medium text-brand hover:underline">
                All
              </Link>
            </div>
            {data.notifications.length === 0 ? (
              <p className="text-sm text-muted">No notifications yet.</p>
            ) : (
              <ul className="grid gap-3">
                {data.notifications.map((n) => (
                  <li key={n.id} className="flex gap-3">
                    <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read ? "bg-line-strong" : "bg-copper"}`} aria-hidden />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">
                        {n.title}
                        {!n.read && <span className="sr-only"> (unread)</span>}
                      </p>
                      <p className="line-clamp-2 text-xs text-muted">{n.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {data.reminders.length > 0 && (
            <Card className="p-5 sm:p-6">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-ink">
                <Bell className="size-4 text-copper" aria-hidden /> Next reminders
              </h2>
              <ul className="grid gap-2 text-sm">
                {data.reminders.map((r) => (
                  <li key={r.id} className="flex justify-between gap-3">
                    <span className="truncate text-ink-2">{r.title}</span>
                    <span className="shrink-0 text-muted">{formatDateTime(r.remindAt)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      <h2 className="mb-3 mt-10 text-lg font-semibold text-ink">Quick links</h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {quick.map((q) => (
          <li key={q.href}>
            <Link
              href={q.href}
              className="group flex min-h-16 items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-brand/40 hover:bg-surface-2"
            >
              <q.icon className="size-5 shrink-0 text-brand" aria-hidden />
              <span className="min-w-0 flex-1 text-sm font-medium text-ink">{q.label}</span>
              {q.locked ? (
                <Badge tone="copper" className="hidden sm:inline-flex">Upgrade</Badge>
              ) : (
                <ArrowUpRight className="size-4 shrink-0 text-faint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
