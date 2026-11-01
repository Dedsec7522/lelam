"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Search, SearchX, X } from "lucide-react";
import { FAQ_GROUPS, FAQS, type Faq, type FaqGroup } from "@/content/faqs";
import { Accordion } from "@/components/ui/accordion";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

type Tab = "all" | FaqGroup;

const TABS: { value: Tab; label: string }[] = [{ value: "all", label: "All" }, ...FAQ_GROUPS.map((g) => ({ value: g.id, label: g.label }))];
const IDS = new Set(FAQS.map((f) => f.id));

function termsOf(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);
}

function matches(f: Faq, terms: string[]): boolean {
  if (!terms.length) return true;
  const hay = `${f.q} ${f.a} ${f.tags.join(" ")}`.toLowerCase();
  return terms.every((t) => hay.includes(t));
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Wraps matched terms in <mark>, as React elements. */
function highlight(text: string, terms: string[]): ReactNode {
  if (!terms.length) return text;
  const re = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
  const lower = new Set(terms);
  return text.split(re).map((part, i) =>
    lower.has(part.toLowerCase()) ? (
      <mark key={i} className="rounded-sm bg-copper-soft px-0.5 text-ink">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

export function FaqCentre() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [openId, setOpenId] = useState<string | undefined>(undefined);
  const [deepLinkTick, setDeepLinkTick] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const terms = useMemo(() => termsOf(query), [query]);
  const results = useMemo(() => FAQS.filter((f) => (tab === "all" || f.group === tab) && matches(f, terms)), [tab, terms]);

  // Deep links: /faq#emd-refund resets filters, opens that item and scrolls it into view.
  const openFromHash = useCallback(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!IDS.has(id)) return;
    setQuery("");
    setTab("all");
    setOpenId(id);
    setDeepLinkTick((n) => n + 1);
  }, []);

  useEffect(() => {
    // Initial hash is read after hydration (next frame) so the server render stays the default view.
    const frame = requestAnimationFrame(openFromHash);
    window.addEventListener("hashchange", openFromHash);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", openFromHash);
    };
  }, [openFromHash]);

  useEffect(() => {
    if (!deepLinkTick || !openId) return;
    const frame = requestAnimationFrame(() => {
      const el = document.getElementById(openId);
      if (!el) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      el.querySelector<HTMLButtonElement>("button[aria-expanded]")?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [deepLinkTick, openId]);

  const groupsInResults = tab === "all" ? FAQ_GROUPS.filter((g) => results.some((f) => f.group === g.id)) : FAQ_GROUPS.filter((g) => g.id === tab);
  const countLabel = terms.length
    ? `${results.length} ${results.length === 1 ? "answer matches" : "answers match"} “${query.trim()}”`
    : `${results.length} ${results.length === 1 ? "answer" : "answers"}`;

  return (
    <div>
      <div className="mx-auto max-w-2xl">
        <label htmlFor="faq-search" className="sr-only">
          Search the help centre
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-faint" aria-hidden />
          <input
            ref={inputRef}
            id="faq-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search EMD, extensions, GST, refunds…"
            autoComplete="off"
            aria-describedby="faq-count"
            className="h-14 w-full rounded-2xl border border-line-strong bg-surface pl-12 pr-14 text-base text-ink shadow-sm placeholder:text-faint transition-[border-color,box-shadow] duration-150 hover:border-ink/25 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/12 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-xl text-muted hover:bg-paper-2 hover:text-ink"
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
        </div>
        <p id="faq-count" aria-live="polite" className="mt-3 text-center text-sm text-muted">
          <span className="rounded-full bg-paper-2 px-2.5 py-1 font-mono text-[0.78rem] text-ink-2">{countLabel}</span>
        </p>
      </div>

      <div className="mt-8 flex justify-center">
        <div className="max-w-full overflow-x-auto px-1 py-1">
          <Segmented
            label="FAQ topics"
            options={TABS}
            value={tab}
            onChange={setTab}
            controls="faq-panel"
            className="[&_[role=tab]]:h-11"
          />
        </div>
      </div>

      <div id={`faq-panel-${tab}`} role="tabpanel" aria-label={TABS.find((t) => t.value === tab)?.label} className="mx-auto mt-10 max-w-3xl">
        {results.length === 0 ? (
          <EmptyState
            icon={<SearchX className="size-5" aria-hidden />}
            title="No answers match that search"
            description="Try a shorter word, like “EMD” or “refund”, or switch to All topics."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery("");
                  setTab("all");
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-10">
            {groupsInResults.map((g) => {
              const items = results.filter((f) => f.group === g.id);
              return (
                <section key={g.id} aria-labelledby={`faq-group-${g.id}`}>
                  <h2 id={`faq-group-${g.id}`} className="eyebrow mb-4">
                    {g.label} <span className="text-faint">({items.length})</span>
                  </h2>
                  <Accordion
                    // Remount when a deep link targets an item, so it opens via defaultOpen.
                    key={`${g.id}-${deepLinkTick}`}
                    defaultOpen={openId && items.some((f) => f.id === openId) ? openId : undefined}
                    items={items.map((f) => ({ id: f.id, title: highlight(f.q, terms), content: highlight(f.a, terms) }))}
                  />
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
