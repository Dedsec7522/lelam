"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  Check,
  CircleDashed,
  Copy,
  ExternalLink,
  FileStack,
  Lock,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDate, formatDateTime, formatINR, formatNumber, formatPercent } from "@/lib/format";
import { canUse } from "@/lib/plans";
import { CATEGORY_BY_ID } from "@/lib/taxonomy";
import { motionTokens } from "@/lib/motion";
import type { Auction } from "@/lib/types";
import { AuctionStatus } from "@/components/ui/countdown";
import { Badge, Stat } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { useSession } from "@/components/session";
import { useToast } from "@/components/ui/toast";
import { LandedCostDemo } from "@/components/home/landed-cost-demo";
import { WatchButton } from "./watch-button";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

export interface PublicProjection {
  turnover: number;
  predictedClose: number;
  profit: number;
  roiPercent: number;
}

type Tab = "overview" | "lots" | "costs" | "intel";

const PORTALS = {
  MSTC: "https://www.mstcecommerce.com/auctionhome/index.jsp",
  BaankNet: "https://baanknet.com/",
} as const;

export function AuctionDetail({ auction, projection, mode = "page" }: { auction: Auction; projection: PublicProjection; mode?: "page" | "modal" }) {
  const [tab, setTab] = useState<Tab>("overview");
  const reduce = useSafeReducedMotion();
  const toast = useToast();
  const cat = CATEGORY_BY_ID[auction.category];

  async function copyRef() {
    try {
      await navigator.clipboard.writeText(auction.officialRef);
      toast({ tone: "success", title: "Reference number copied" });
    } catch {
      toast({ tone: "error", title: "Couldn't copy. Select the reference and copy it manually." });
    }
  }

  return (
    <div className={cn(mode === "modal" ? "p-5 sm:p-7" : "")}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="ink">{auction.source}</Badge>
        <Badge>{cat.label}</Badge>
        <Badge>{auction.auctionType}</Badge>
        {auction.isReauction && (
          <Badge tone="copper">
            <RotateCcw className="size-3" aria-hidden /> Re-auction
          </Badge>
        )}
        <span className="ml-auto">
          <AuctionStatus startsAt={auction.startsAt} endsAt={auction.endsAt} />
        </span>
      </div>

      {mode === "page" ? (
        <h1 className="mt-4 text-[2rem] font-semibold leading-tight tracking-[-0.025em] text-ink sm:text-[2.6rem]">{auction.title}</h1>
      ) : (
        <h2 className="mt-4 text-2xl font-semibold leading-tight text-ink">{auction.title}</h2>
      )}
      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-4" aria-hidden /> {auction.city}, {auction.state}
        </span>
        <span>·</span>
        <span>{auction.seller}</span>
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2">
        <span className="eyebrow text-[0.62rem]">Official ref</span>
        <code className="min-w-0 flex-1 truncate font-mono text-[0.8rem] text-ink-2">{auction.officialRef}</code>
        <button type="button" onClick={copyRef} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[0.8rem] font-medium text-brand hover:bg-brand-soft">
          <Copy className="size-3.5" aria-hidden /> Copy
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <WatchButton auctionId={auction.id} variant="full" />
        <ButtonLink href={`/dashboard/quotes/new?auction=${auction.id}`} variant="secondary">
          <FileStack className="size-4" aria-hidden /> Build a quote
        </ButtonLink>
        <ButtonLink href={`/dashboard/shipping-requests?new=1&auction=${auction.id}`} variant="secondary">
          <Truck className="size-4" aria-hidden /> Transport quote
        </ButtonLink>
        <a
          href={PORTALS[auction.source]}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-ink px-5 text-[0.95rem] font-medium text-paper hover:bg-ink-2"
        >
          Bid on {auction.source} <ExternalLink className="size-4" aria-hidden />
          <span className="sr-only">(opens official portal in a new tab)</span>
        </a>
      </div>

      <div className="mt-8 overflow-x-auto pb-1">
        <Segmented<Tab>
          label="Auction sections"
          value={tab}
          onChange={setTab}
          controls={`tab-${auction.id}`}
          options={[
            { value: "overview", label: "Overview" },
            { value: "lots", label: `Lots (${auction.lots.length})` },
            { value: "costs", label: "Landed cost" },
            { value: "intel", label: "Bid Intelligence" },
          ]}
        />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          id={`tab-${auction.id}-${tab}`}
          role="tabpanel"
          initial={{ opacity: 0, y: reduce ? 0 : motionTokens.distance.sm }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduce ? 0 : -motionTokens.distance.xs }}
          transition={{ duration: motionTokens.duration.fast, ease: motionTokens.easing.smooth }}
          className="mt-6"
        >
          {tab === "overview" && <Overview auction={auction} projection={projection} />}
          {tab === "lots" && <LotsTable auction={auction} />}
          {tab === "costs" && <CostsTab auction={auction} projection={projection} />}
          {tab === "intel" && <IntelTab auction={auction} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Overview({ auction, projection }: { auction: Auction; projection: PublicProjection }) {
  const facts = [
    { k: "Bidding opens", v: formatDateTime(auction.startsAt) },
    { k: "Bidding closes", v: formatDateTime(auction.endsAt) },
    { k: "Inspection", v: `${formatDate(auction.inspectionFrom)} – ${formatDate(auction.inspectionTo)}` },
    { k: "Regional office", v: auction.office },
    { k: "EMD", v: `${auction.emdPercent}% of bid value` },
    { k: auction.source === "BaankNet" ? "Reserve price" : "Pre-bid EMD", v: auction.source === "BaankNet" ? formatINR(auction.reservePrice ?? 0) : auction.preBidEmd ? formatINR(auction.preBidEmd) : "Not an auto pre-bid EMD auction" },
    { k: "GST", v: auction.gstRate ? `${auction.gstRate}% · ${auction.gstScheme === "RCM" ? "reverse charge (buyer pays)" : "forward charge"}` : "Not applicable" },
    { k: "Est. weight", v: auction.weightTonnes ? `${formatNumber(auction.weightTonnes, 2)} t` : "—" },
  ];
  return (
    <div className="space-y-8">
      <section aria-labelledby="ma-title">
        <h3 id="ma-title" className="eyebrow mb-3">
          Market analysis · indicative
        </h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Resale value" value={formatINR(projection.turnover, { compact: true })} />
          <Stat label="Predicted close" value={formatINR(projection.predictedClose, { compact: true })} />
          <Stat label="Projected profit" value={formatINR(projection.profit, { compact: true })} tone="positive" />
          <Stat label="Projected ROI" value={formatPercent(projection.roiPercent)} tone="positive" />
        </div>
      </section>

      <section aria-labelledby="facts-title">
        <h3 id="facts-title" className="eyebrow mb-3">
          Key facts
        </h3>
        <dl className="grid overflow-hidden rounded-2xl border border-line sm:grid-cols-2">
          {facts.map((f) => (
            <div key={f.k} className="border-b border-line bg-surface px-4 py-3 last:border-b-0 sm:odd:border-r">
              <dt className="text-[0.75rem] text-muted">{f.k}</dt>
              <dd className="mt-0.5 text-sm font-medium text-ink">{f.v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby="comp-title" className="rounded-2xl border border-line bg-surface p-5">
          <h3 id="comp-title" className="font-semibold text-ink">
            Compliance & documents
          </h3>
          <ul className="mt-4 space-y-3">
            {auction.compliance.map((c) => (
              <li key={c.title} className="flex gap-3">
                <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full", c.conditional ? "bg-warning-soft text-warning" : "bg-positive-soft text-positive")}>
                  {c.conditional ? <CircleDashed className="size-3.5" aria-hidden /> : <Check className="size-3.5" aria-hidden />}
                </span>
                <span>
                  <span className="text-sm font-medium text-ink">
                    {c.title}
                    {c.conditional && <span className="ml-2 text-[0.7rem] font-semibold uppercase tracking-wide text-warning">Conditional</span>}
                  </span>
                  <span className="mt-0.5 block text-[0.82rem] text-muted">{c.description}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="contact-title" className="rounded-2xl border border-line bg-surface p-5">
          <h3 id="contact-title" className="font-semibold text-ink">
            Auction contacts
          </h3>
          <ul className="mt-4 space-y-4">
            {auction.contacts.map((c) => (
              <li key={c.email} className="text-sm">
                <p className="font-medium text-ink">{c.name}</p>
                <p className="text-[0.8rem] text-muted">{c.role}</p>
                <p className="mt-2 flex items-center gap-2 text-ink-2">
                  <Mail className="size-4 text-faint" aria-hidden />
                  <a href={`mailto:${c.email}`} className="hover:text-brand">
                    {c.email}
                  </a>
                </p>
                <p className="mt-1 flex items-center gap-2 text-ink-2">
                  <Phone className="size-4 text-faint" aria-hidden />
                  <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="hover:text-brand">
                    {c.phone}
                  </a>
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[0.75rem] text-faint">Listed as published in the catalog. Lelam is not affiliated with the seller or portal.</p>
        </section>
      </div>

      <p className="text-[0.95rem] leading-relaxed text-muted">{auction.description}</p>
    </div>
  );
}

function LotsTable({ auction }: { auction: Auction }) {
  const total = auction.lots.reduce((s, l) => s + l.quantity * l.marketPrice, 0);
  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="w-full min-w-[620px] text-left text-sm">
        <caption className="sr-only">Lots identified in this auction with indicative market prices</caption>
        <thead className="bg-paper-2 text-[0.75rem] uppercase tracking-wide text-muted">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Lot</th>
            <th scope="col" className="px-4 py-3 font-medium">Material</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Quantity</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Market price</th>
            <th scope="col" className="px-4 py-3 text-right font-medium">Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line bg-surface">
          {auction.lots.map((l) => (
            <tr key={l.lotNo} className="transition-colors hover:bg-surface-2">
              <td className="px-4 py-3 font-mono text-[0.78rem] text-muted">{l.lotNo}</td>
              <td className="px-4 py-3 font-medium text-ink">{l.description}</td>
              <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-2">
                {formatNumber(l.quantity, 3)} {l.unit}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums text-positive">
                {formatINR(l.marketPrice)}/{l.unit}
              </td>
              <td className="px-4 py-3 text-right font-mono tabular-nums text-ink">{formatINR(l.quantity * l.marketPrice)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-surface-2">
          <tr>
            <th scope="row" colSpan={4} className="px-4 py-3 text-right font-medium text-ink-2">
              Total indicative value
            </th>
            <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-ink">{formatINR(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function CostsTab({ auction, projection }: { auction: Auction; projection: PublicProjection }) {
  const { user } = useSession();
  if (!user || !canUse(user.plan, "landedCost")) {
    return (
      <Locked
        title="Landed-cost estimator"
        text="See GST (with reverse charge), TCS, transport and loading on top of your bid for this lot, with ITC-aware totals."
        plan="Individual"
        signedIn={!!user}
      />
    );
  }
  return (
    <LandedCostDemo
      compact
      initial={{ bid: Math.round(projection.predictedClose / 1000) * 1000 || 100000, weight: Math.max(1, Math.round(auction.weightTonnes)), distance: 150, gst: auction.gstRate || 18 }}
    />
  );
}

interface Intel {
  projection: { turnover: number; predictedClose: number };
  scenarios: { key: "conservative" | "aggressive" | "walkAway"; bid: number; winProbability: number; marginPercent: number }[];
  warnings: string[];
}

function IntelTab({ auction }: { auction: Auction }) {
  const { user, status } = useSession();
  const [state, setState] = useState<{ kind: "loading" } | { kind: "locked"; signedIn: boolean } | { kind: "ok"; data: Intel } | { kind: "error"; message: string }>({ kind: "loading" });
  const reduce = useSafeReducedMotion();

  useEffect(() => {
    if (status === "loading" || !user) return;
    let cancelled = false;
    fetch(`/api/auctions/${auction.id}/intelligence`, { cache: "no-store" })
      .then(async (r) => {
        if (cancelled) return;
        if (r.status === 401 || r.status === 403) return setState({ kind: "locked", signedIn: r.status === 403 });
        if (!r.ok) return setState({ kind: "error", message: "Couldn't load Bid Intelligence. Try again shortly." });
        setState({ kind: "ok", data: (await r.json()) as Intel });
      })
      .catch(() => !cancelled && setState({ kind: "error", message: "Network error loading Bid Intelligence." }));
    return () => {
      cancelled = true;
    };
  }, [auction.id, user, status]);

  if (status === "ready" && !user)
    return (
      <Locked
        title="Bid Intelligence"
        text="Conservative, aggressive and walk-away bid caps with win probability, margin at each price and risk warnings for this lot."
        plan="Business"
        signedIn={false}
      />
    );
  if (state.kind === "loading") return <div className="h-48 skeleton rounded-2xl" aria-label="Loading Bid Intelligence" />;
  if (state.kind === "locked")
    return (
      <Locked
        title="Bid Intelligence"
        text="Conservative, aggressive and walk-away bid caps with win probability, margin at each price and risk warnings for this lot."
        plan="Business"
        signedIn={state.signedIn}
      />
    );
  if (state.kind === "error") return <p role="alert" className="text-sm text-danger">{state.message}</p>;

  const labels = { conservative: "Conservative", aggressive: "Aggressive", walkAway: "Walk-away" };
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {state.data.scenarios.map((s, i) => (
          <div key={s.key} className={cn("rounded-2xl border p-5", s.key === "walkAway" ? "border-copper/40 bg-copper-soft/40" : "border-line bg-surface")}>
            <p className="eyebrow text-[0.62rem]">{labels[s.key]} cap</p>
            <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-ink">{formatINR(s.bid, { compact: true })}</p>
            <div className="mt-4">
              <div className="flex justify-between text-[0.75rem] text-muted">
                <span>Win probability</span>
                <span className="font-mono text-ink">{s.winProbability}%</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-paper-2">
                <motion.div
                  className="h-full origin-left rounded-full bg-brand"
                  style={{ width: `${s.winProbability}%` }}
                  initial={{ scaleX: reduce ? 1 : 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: motionTokens.duration.slow, ease: motionTokens.easing.smooth, delay: i * motionTokens.stagger.loose }}
                />
              </div>
            </div>
            <p className="mt-3 text-[0.8rem] text-muted">
              Margin at this price <span className={cn("font-mono font-medium", s.marginPercent >= 10 ? "text-positive" : "text-warning")}>{formatPercent(s.marginPercent)}</span>
            </p>
          </div>
        ))}
      </div>
      {state.data.warnings.length > 0 && (
        <ul className="space-y-2 rounded-2xl border border-warning/30 bg-warning-soft p-5">
          {state.data.warnings.map((w) => (
            <li key={w} className="flex gap-2.5 text-sm text-ink-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
              {w}
            </li>
          ))}
        </ul>
      )}
      <p className="text-[0.75rem] text-faint">Model output for decision support. Inspect the lot and confirm the STC before bidding.</p>
    </div>
  );
}

function Locked({ title, text, plan, signedIn }: { title: string; text: string; plan: string; signedIn: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-line bg-surface p-8 text-center">
      <div className="bg-grid absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" aria-hidden />
      <div className="relative">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-ink text-paper">
          <Lock className="size-5" aria-hidden />
        </span>
        <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">{text}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {signedIn ? (
            <ButtonLink href="/pricing">Upgrade to {plan}</ButtonLink>
          ) : (
            <>
              <ButtonLink href="/auth/register">Create free account</ButtonLink>
              <ButtonLink href="/pricing" variant="secondary">
                See plans
              </ButtonLink>
            </>
          )}
        </div>
        <p className="mt-4 text-[0.75rem] text-faint">
          Included in {plan} and above.{" "}
          <Link href="/pricing" className="underline underline-offset-2">
            Compare plans
          </Link>
        </p>
      </div>
    </div>
  );
}
