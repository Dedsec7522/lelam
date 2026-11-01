"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, LayoutGrid, List, LocateFixed, MapPin, Search, SlidersHorizontal, Tag, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useStoredState } from "@/lib/use-stored-state";
import { CATEGORY_BY_ID } from "@/lib/taxonomy";
import { motionTokens, springs } from "@/lib/motion";
import type { CategoryId } from "@/lib/types";
import { Drawer } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";
import { Segmented } from "@/components/ui/segmented";
import { AuctionCard, AuctionCardSkeleton, type CardAuction } from "./auction-card";
import { WatchlistProvider } from "./watch-button";
import { FilterPanel, FILTER_KEYS, countActive, type FilterValues } from "./filter-panel";
import { QuickView } from "./quick-view";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";
import { STATIC_DEMO } from "@/lib/site";
import type { FilterInput } from "@/lib/run-search";

export interface MarketResult {
  items: CardAuction[];
  total: number;
  page: number;
  pages: number;
  understood: {
    category?: CategoryId;
    subCategory?: string;
    city?: string;
    state?: string;
    nearMe: boolean;
    radiusKm?: number;
    reauction?: boolean;
  } | null;
}

type Cols = "2" | "3" | "4";
type View = "grid" | "list";

const SORTS = [
  { value: "ending", label: "Opening soonest" },
  { value: "newest", label: "Latest dates" },
  { value: "value-desc", label: "Highest value" },
  { value: "emd-asc", label: "Lowest pre-bid EMD" },
  { value: "distance", label: "Nearest first" },
];

function readFilters(sp: URLSearchParams): FilterValues {
  const b = (k: string) => (sp.get(k) === "1" ? true : undefined);
  return {
    category: (sp.get("category") as CategoryId) || undefined,
    sub: sp.get("sub") || undefined,
    source: (sp.get("source") as FilterValues["source"]) || undefined,
    state: sp.get("state") || undefined,
    office: sp.get("office") || undefined,
    prebid: (sp.get("prebid") as FilterValues["prebid"]) || undefined,
    docs: b("docs"),
    images: b("images"),
    reauction: b("reauction"),
    status: (sp.get("status") as FilterValues["status"]) || undefined,
    from: sp.get("from") || undefined,
    to: sp.get("to") || undefined,
    radius: sp.get("radius") ? Number(sp.get("radius")) : undefined,
  };
}

export function Marketplace({
  initial,
  canReauction,
  localSearch,
}: {
  initial: MarketResult;
  canReauction: boolean;
  /** Static (GitHub Pages) build: run near-me searches in the browser instead of POSTing to the API. */
  localSearch?: (input: FilterInput) => MarketResult;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const reduce = useSafeReducedMotion();
  const [pending, startTransition] = useTransition();

  const [q, setQ] = useState(sp.get("q") ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draft, setDraft] = useState<FilterValues>(() => readFilters(sp));
  const [view, setView] = useStoredState<View>("lelam-market-view", "grid", ["grid", "list"]);
  const [cols, setCols] = useStoredState<Cols>("lelam-market-cols", "3", ["2", "3", "4"]);
  const [quickId, setQuickId] = useState<string | null>(null);
  // Changes only on open, so the dialog keeps its exit animation when closed.
  const [quickKey, setQuickKey] = useState("none");
  const openQuick = useCallback((id: string) => {
    setQuickKey(id);
    setQuickId(id);
  }, []);
  const [geo, setGeo] = useState<{ status: "idle" | "locating" | "ready" | "denied"; coords?: { lat: number; lng: number } }>({ status: "idle" });
  // Near-me results are tagged with the query they were fetched for, so stale data never shows.
  const [nearResult, setNearResult] = useState<{ key: string; data: MarketResult | null } | null>(null);

  const filters = useMemo(() => readFilters(sp), [sp]);
  const nearWanted = sp.get("near") === "1" || !!initial.understood?.nearMe;
  const sort = sp.get("sort") ?? (nearWanted ? "distance" : "ending");
  const nearFresh = nearResult && nearResult.key === sp.toString() ? nearResult : null;
  const result = nearWanted && nearFresh?.data ? nearFresh.data : initial;

  // Keep the search box in sync when the URL query changes (back/forward, chip removal).
  const urlQ = sp.get("q") ?? "";
  const [lastUrlQ, setLastUrlQ] = useState(urlQ);
  if (urlQ !== lastUrlQ) {
    setLastUrlQ(urlQ);
    setQ(urlQ);
  }

  const navigate = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const params = new URLSearchParams(sp.toString());
      mutate(params);
      params.delete("page");
      startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false }));
    },
    [sp, pathname, router],
  );

  // "Near me": ask the browser for location only when the user asked for it, then search via POST.
  useEffect(() => {
    if (!nearWanted) return;
    if (geo.status === "idle") {
      if (!("geolocation" in navigator)) {
        queueMicrotask(() => setGeo({ status: "denied" }));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => setGeo({ status: "ready", coords: { lat: Math.round(pos.coords.latitude * 100) / 100, lng: Math.round(pos.coords.longitude * 100) / 100 } }),
        () => setGeo({ status: "denied" }),
        { enableHighAccuracy: false, timeout: 10_000, maximumAge: 600_000 },
      );
      return;
    }
    if (geo.status !== "ready" || !geo.coords) return;
    const controller = new AbortController();
    const body = {
      q: sp.get("q") || undefined,
      category: filters.category,
      subCategory: filters.sub,
      source: filters.source,
      state: filters.state,
      office: filters.office,
      preBid: filters.prebid,
      docs: filters.docs,
      images: filters.images,
      reauction: filters.reauction,
      from: filters.from,
      to: filters.to,
      status: filters.status,
      sort,
      radiusKm: filters.radius ?? initial.understood?.radiusKm ?? 200,
      near: geo.coords,
      page: Number(sp.get("page") ?? 1),
    };
    const key = sp.toString();
    if (localSearch) {
      queueMicrotask(() => setNearResult({ key, data: localSearch(body as FilterInput) }));
      return () => controller.abort();
    }
    fetch("/api/auctions/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(`search ${r.status}`);
        setNearResult({ key, data: (await r.json()) as MarketResult });
      })
      .catch((err: Error) => {
        // Fall back to the server results rather than showing stale or broken data.
        if (err.name !== "AbortError") setNearResult({ key, data: null });
      });
    return () => controller.abort();
  }, [nearWanted, geo, sp, filters, sort, initial.understood?.radiusKm, localSearch]);

  const activeCount = countActive(filters);
  const chips = buildChips(filters, result.understood, nearWanted, geo.status);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate((p) => {
      if (q.trim()) p.set("q", q.trim());
      else p.delete("q");
      if (/\b(near me|nearby|within \d+\s?km)\b/i.test(q)) p.set("near", "1");
    });
  }

  function applyFilters(next: FilterValues) {
    navigate((p) => {
      for (const k of FILTER_KEYS) {
        const v = next[k];
        if (v === undefined || v === "" || v === false) p.delete(k);
        else p.set(k, v === true ? "1" : String(v));
      }
    });
    setFiltersOpen(false);
  }

  function removeChip(key: string) {
    navigate((p) => {
      if (key === "q") p.delete("q");
      else if (key === "near") {
        p.delete("near");
        p.delete("radius");
        const cur = p.get("q");
        if (cur) p.set("q", cur.replace(/\b(near me|nearby|within \d+\s?km)\b/gi, "").replace(/\s+/g, " ").trim());
      } else p.delete(key);
    });
  }

  const gridCols = view === "list" ? "grid-cols-1" : cols === "2" ? "sm:grid-cols-2" : cols === "4" ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";
  const loading = pending || (nearWanted && (geo.status === "idle" || (geo.status === "ready" && !nearFresh)));

  return (
    <WatchlistProvider>
      <section className="relative overflow-hidden border-b border-line bg-surface">
        <div className="hero-glow absolute inset-0" aria-hidden />
        <div className="bg-grid absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
        <div className="container-page relative py-12 sm:py-16">
          <p className="eyebrow">Marketplace</p>
          <h1 className="mt-3 max-w-3xl text-[2.3rem] font-semibold leading-[1.05] tracking-[-0.03em] text-ink sm:text-[3rem]">
            Government & bank auctions, <span className="font-serif font-normal italic text-brand">one search.</span>
          </h1>
          <form role="search" onSubmit={submitSearch} className="mt-8 flex max-w-3xl items-center gap-2 rounded-2xl border border-line-strong bg-surface p-2 pl-4 shadow-sm focus-within:border-brand focus-within:shadow-md">
            <Search className="size-5 shrink-0 text-muted" aria-hidden />
            <label htmlFor="market-q" className="sr-only">
              Search auctions
            </label>
            <input
              id="market-q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Try “aluminium scrap in Gujarat” or “vehicles within 100 km”"
              className="h-12 min-w-0 flex-1 bg-transparent text-ink placeholder:text-faint focus:outline-none"
            />
            <button
              type="button"
              onClick={() => navigate((p) => p.set("near", "1"))}
              className="hidden h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-ink-2 hover:bg-paper-2 sm:inline-flex"
            >
              <LocateFixed className="size-4" aria-hidden /> Near me
            </button>
            <Button type="submit" variant="ink" className="h-12">
              Search
            </Button>
          </form>
        </div>
      </section>

      <div className="container-page py-8">
        {/* Toolbar */}
        <div className="sticky top-[72px] z-30 -mx-4 flex flex-wrap items-center gap-3 border-b border-line bg-surface/85 px-4 py-3 shadow-sm backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:border sm:px-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setDraft(filters);
              setFiltersOpen(true);
            }}
            aria-haspopup="dialog"
          >
            <SlidersHorizontal className="size-4" aria-hidden />
            Filters
            {activeCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-brand text-[0.7rem] text-on-brand">{activeCount}</span>}
          </Button>
          <p className="text-sm text-muted" aria-live="polite">
            <span className="font-semibold text-ink">{result.total.toLocaleString("en-IN")}</span> auctions
          </p>
          <div className="ml-auto flex items-center gap-2">
            <label htmlFor="sort" className="sr-only">
              Sort
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => navigate((p) => p.set("sort", e.target.value))}
              className="h-9 rounded-[10px] border border-line-strong bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none"
            >
              {SORTS.filter((s) => s.value !== "distance" || nearWanted).map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            {view === "grid" && (
              <div className="hidden lg:block">
                <Segmented variant="radio" size="sm" label="Columns" value={cols} onChange={setCols} options={[{ value: "2", label: "2" }, { value: "3", label: "3" }, { value: "4", label: "4" }]} />
              </div>
            )}
            <Segmented
              variant="radio"
              size="sm"
              label="Layout"
              value={view}
              onChange={setView}
              options={[
                { value: "grid", label: <LayoutGrid className="size-4" aria-label="Grid view" /> },
                { value: "list", label: <List className="size-4" aria-label="List view" /> },
              ]}
            />
          </div>
        </div>

        {/* Understood-as chips */}
        <AnimatePresence initial={false}>
          {chips.length > 0 && (
            <motion.ul
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: motionTokens.duration.fast }}
              className="mt-4 flex flex-wrap items-center gap-2"
              aria-label="Active search and filters"
            >
              {chips.map((c) => (
                <motion.li key={c.key + c.label} layout={!reduce} transition={springs.snappy}>
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full py-1 pl-3 pr-1 text-[0.8rem] font-medium", c.tone === "info" ? "bg-paper-2 text-ink-2" : "bg-brand-soft text-brand-ink")}>
                    {c.icon}
                    {c.label}
                    {c.removable && (
                      <button type="button" onClick={() => removeChip(c.key)} aria-label={`Remove ${c.label}`} className="grid size-6 place-items-center rounded-full hover:bg-ink/10">
                        <X className="size-3.5" />
                      </button>
                    )}
                  </span>
                </motion.li>
              ))}
              {(activeCount > 0 || sp.get("q")) && (
                <li>
                  <button type="button" onClick={() => startTransition(() => router.push(pathname, { scroll: false }))} className="px-2 text-[0.8rem] font-medium text-muted underline-offset-4 hover:text-ink hover:underline">
                    Clear all
                  </button>
                </li>
              )}
            </motion.ul>
          )}
        </AnimatePresence>

        {/* Results */}
        <div className="relative mt-6" aria-busy={loading}>
          {loading && result.items.length === 0 ? (
            <div className={cn("grid gap-5", gridCols)}>
              {Array.from({ length: 6 }, (_, i) => (
                <AuctionCardSkeleton key={i} />
              ))}
            </div>
          ) : result.items.length === 0 ? (
            <EmptyState
              icon={<Search className="size-5" />}
              title="No auctions match"
              description="Try a wider radius, a different state, or remove a filter. New catalogs are added every day."
              action={
                <Button variant="secondary" onClick={() => router.push(pathname)}>
                  Reset search
                </Button>
              }
            />
          ) : (
            <motion.ul
              key={`${result.page}-${sp.toString()}-${view}`}
              initial="hidden"
              animate="visible"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: motionTokens.stagger.tight } } }}
              className={cn("grid gap-5 transition-opacity duration-200", gridCols, loading && "opacity-60")}
            >
              {result.items.map((a) => (
                <motion.li
                  key={a.id}
                  variants={{
                    hidden: { opacity: 0, y: reduce ? 0 : motionTokens.distance.md },
                    visible: { opacity: 1, y: 0, transition: { duration: motionTokens.duration.normal, ease: motionTokens.easing.smooth } },
                  }}
                >
                  <AuctionCard auction={a} onOpen={STATIC_DEMO ? undefined : openQuick} layout={view} />
                </motion.li>
              ))}
            </motion.ul>
          )}
        </div>

        {result.pages > 1 && (
          <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
            <PageLink page={result.page - 1} disabled={result.page <= 1} sp={sp} pathname={pathname} label="Previous page">
              <ChevronLeft className="size-4" />
            </PageLink>
            {pageWindow(result.page, result.pages).map((p, i) =>
              p === null ? (
                <span key={`gap-${i}`} className="px-1 text-muted">
                  …
                </span>
              ) : (
                <PageLink key={p} page={p} sp={sp} pathname={pathname} current={p === result.page} label={`Page ${p}`}>
                  {p}
                </PageLink>
              ),
            )}
            <PageLink page={result.page + 1} disabled={result.page >= result.pages} sp={sp} pathname={pathname} label="Next page">
              <ChevronRight className="size-4" />
            </PageLink>
          </nav>
        )}
      </div>

      <Drawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filter auctions"
        side="left"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setDraft({})}>
              Reset
            </Button>
            <Button className="flex-1" onClick={() => applyFilters(draft)}>
              Show results
            </Button>
          </div>
        }
      >
        <FilterPanel value={draft} onChange={setDraft} canReauction={canReauction} nearActive={nearWanted} />
      </Drawer>

      <QuickView key={quickKey} id={quickId} onClose={() => setQuickId(null)} />
    </WatchlistProvider>
  );
}

function PageLink({
  page,
  sp,
  pathname,
  children,
  current,
  disabled,
  label,
}: {
  page: number;
  sp: URLSearchParams;
  pathname: string;
  children: React.ReactNode;
  current?: boolean;
  disabled?: boolean;
  label: string;
}) {
  const router = useRouter();
  const params = new URLSearchParams(sp.toString());
  params.set("page", String(page));
  return (
    <button
      type="button"
      disabled={disabled}
      aria-current={current ? "page" : undefined}
      aria-label={label}
      onClick={() => {
        router.push(`${pathname}?${params.toString()}`);
      }}
      className={cn(
        "grid h-10 min-w-10 place-items-center rounded-xl px-3 text-sm font-medium transition-colors disabled:opacity-40",
        current ? "bg-ink text-paper" : "border border-line bg-surface text-ink-2 hover:border-line-strong",
      )}
    >
      {children}
    </button>
  );
}

function pageWindow(page: number, pages: number): (number | null)[] {
  const out: (number | null)[] = [];
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - page) <= 1) out.push(p);
    else if (out[out.length - 1] !== null) out.push(null);
  }
  return out;
}

interface Chip {
  key: string;
  label: string;
  icon?: React.ReactNode;
  removable: boolean;
  tone?: "info";
}

function buildChips(f: FilterValues, u: MarketResult["understood"], near: boolean, geo: string): Chip[] {
  const chips: Chip[] = [];
  if (u?.category && !f.category) chips.push({ key: "q", label: CATEGORY_BY_ID[u.category].label, icon: <Tag className="size-3.5" />, removable: false, tone: "info" });
  if (u?.subCategory && !f.sub) chips.push({ key: "q", label: u.subCategory, icon: <Tag className="size-3.5" />, removable: false, tone: "info" });
  if (u?.city || u?.state) chips.push({ key: "q", label: (u.city ?? u.state)!, icon: <MapPin className="size-3.5" />, removable: false, tone: "info" });
  if (near)
    chips.push({
      key: "near",
      label: geo === "denied" ? "Location unavailable: showing all" : geo === "idle" ? "Finding your location…" : `Within ${f.radius ?? u?.radiusKm ?? 200} km`,
      icon: <LocateFixed className="size-3.5" />,
      removable: true,
    });
  if (f.category) chips.push({ key: "category", label: CATEGORY_BY_ID[f.category].label, removable: true });
  if (f.sub) chips.push({ key: "sub", label: f.sub, removable: true });
  if (f.source) chips.push({ key: "source", label: f.source === "MSTC" ? "MSTC" : "Bank properties", removable: true });
  if (f.state) chips.push({ key: "state", label: f.state, removable: true });
  if (f.office) chips.push({ key: "office", label: f.office, removable: true });
  if (f.status) chips.push({ key: "status", label: f.status === "live" ? "Live now" : f.status === "open" ? "Open only" : "Upcoming", removable: true });
  if (f.prebid) chips.push({ key: "prebid", label: f.prebid === "required" ? "Pre-bid EMD" : "No pre-bid EMD", removable: true });
  if (f.docs) chips.push({ key: "docs", label: "Has documents", removable: true });
  if (f.images) chips.push({ key: "images", label: "Has images", removable: true });
  if (f.reauction) chips.push({ key: "reauction", label: "Re-auctioned", removable: true });
  if (f.from) chips.push({ key: "from", label: `From ${f.from}`, removable: true });
  if (f.to) chips.push({ key: "to", label: `To ${f.to}`, removable: true });
  return chips;
}
