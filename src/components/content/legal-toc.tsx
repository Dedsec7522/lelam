"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export interface TocEntry {
  id: string;
  title: string;
}

/**
 * Sticky table of contents with scroll-spy. An IntersectionObserver watches every section
 * heading; the active entry is the first section whose top has crossed the reading line.
 */
export function LegalToc({ entries }: { entries: TocEntry[] }) {
  const [active, setActive] = useState<string>(entries[0]?.id ?? "");

  useEffect(() => {
    const els = entries.map((e) => document.getElementById(e.id)).filter((el): el is HTMLElement => el !== null);
    if (!els.length || typeof IntersectionObserver === "undefined") return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (records) => {
        for (const r of records) {
          if (r.isIntersecting) visible.add(r.target.id);
          else visible.delete(r.target.id);
        }
        const first = entries.find((e) => visible.has(e.id));
        if (first) setActive(first.id);
      },
      // The reading line sits just under the sticky header; sections count as "current"
      // while they occupy the upper part of the viewport.
      { rootMargin: "-96px 0px -55% 0px", threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [entries]);

  return (
    <nav aria-label="On this page" className="rounded-3xl border border-line bg-surface p-5">
      <p className="eyebrow mb-3">On this page</p>
      <ol className="flex flex-col gap-0.5">
        {entries.map((e, i) => {
          const isActive = e.id === active;
          return (
            <li key={e.id}>
              <a
                href={`#${e.id}`}
                aria-current={isActive ? "location" : undefined}
                onClick={() => setActive(e.id)}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-[0.9rem] leading-snug transition-colors duration-200",
                  isActive ? "bg-brand-soft font-medium text-brand-ink" : "text-muted hover:bg-paper-2 hover:text-ink",
                )}
              >
                <span className="font-mono text-[0.72rem] tabular-nums opacity-70">{String(i + 1).padStart(2, "0")}</span>
                {e.title}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
