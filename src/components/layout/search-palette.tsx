"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useModalBehaviour } from "@/components/ui/dialog";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, CornerDownLeft, LocateFixed, MapPin, Search, Tag } from "lucide-react";
import { cn } from "@/lib/cn";
import { CATEGORY_BY_ID } from "@/lib/taxonomy";
import { parseQuery, SEARCH_EXAMPLES } from "@/lib/search";
import { fadeOnly, overlayFade, panelPop } from "@/lib/motion";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

/**
 * ⌘K command palette: type plain English, see how it is understood, press Enter to search.
 */
export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const reduce = useSafeReducedMotion();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  // Fresh query each time the palette opens (prop-change pattern, no effect).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setQ("");
      setActive(0);
    }
  }

  // Focus trap, Escape (from anywhere), scroll lock and focus restore; the input has data-autofocus.
  const panel = useRef<HTMLDivElement>(null);
  useModalBehaviour(open, onClose, panel);

  const parsed = useMemo(() => parseQuery(q), [q]);
  const suggestions = useMemo(() => {
    const base = q.trim() ? [q.trim(), ...SEARCH_EXAMPLES.filter((s) => s.toLowerCase().includes(q.toLowerCase()) && s !== q.trim())] : SEARCH_EXAMPLES;
    return base.slice(0, 6);
  }, [q]);

  function go(text: string) {
    const p = parseQuery(text);
    const params = new URLSearchParams({ q: text });
    if (p.nearMe) params.set("near", "1");
    onClose();
    router.push(`/auctions?${params.toString()}`);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(suggestions.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = suggestions[active];
      if (pick) go(pick);
    }
  }

  if (typeof document === "undefined") return null;

  const chips: { icon: React.ReactNode; label: string }[] = [];
  if (parsed.category) chips.push({ icon: <Tag className="size-3.5" />, label: CATEGORY_BY_ID[parsed.category].label });
  if (parsed.subCategory) chips.push({ icon: <Tag className="size-3.5" />, label: parsed.subCategory });
  if (parsed.city || parsed.state) chips.push({ icon: <MapPin className="size-3.5" />, label: parsed.city ?? parsed.state ?? "" });
  if (parsed.nearMe) chips.push({ icon: <LocateFixed className="size-3.5" />, label: `Within ${parsed.radiusKm ?? 200} km of you` });
  if (parsed.reauction) chips.push({ icon: <Tag className="size-3.5" />, label: "Re-auctioned" });

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[12vh]">
          <motion.div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" variants={overlayFade} initial="hidden" animate="visible" exit="exit" onClick={onClose} />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label="Search auctions"
            variants={reduce ? fadeOnly : panelPop}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-line bg-surface shadow-lg"
            onKeyDown={onKey}
          >
            <div className="flex items-center gap-3 border-b border-line px-5">
              <Search className="size-5 text-muted" aria-hidden />
              <input
                ref={input}
                data-autofocus
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setActive(0);
                }}
                role="combobox"
                aria-expanded="true"
                aria-controls="palette-list"
                aria-activedescendant={`palette-opt-${active}`}
                aria-autocomplete="list"
                placeholder="Try “copper scrap in Mumbai” or “vehicles near me”"
                className="h-16 w-full bg-transparent text-[1.05rem] text-ink placeholder:text-faint focus:outline-none"
              />
              <kbd className="hidden rounded-md border border-line px-1.5 py-0.5 font-mono text-[0.68rem] text-muted sm:block">esc</kbd>
            </div>

            <div className="flex min-h-11 flex-wrap items-center gap-2 border-b border-line bg-paper px-5 py-2.5" aria-live="polite">
              {chips.length ? (
                <>
                  <span className="eyebrow text-[0.62rem]">Understood as</span>
                  {chips.map((c) => (
                    <motion.span
                      key={c.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-brand-ink"
                    >
                      {c.icon}
                      {c.label}
                    </motion.span>
                  ))}
                </>
              ) : (
                <span className="text-xs text-muted">Search by material, place, distance or source. Lelam reads it into filters.</span>
              )}
            </div>

            <ul id="palette-list" role="listbox" className="max-h-80 overflow-y-auto p-2">
              {suggestions.map((s, i) => (
                <li
                  key={s}
                  id={`palette-opt-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(s)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-xl px-4 py-3 text-[0.95rem]",
                    i === active ? "bg-paper-2 text-ink" : "text-ink-2",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Search className="size-4 text-faint" aria-hidden />
                    {i === 0 && q.trim() ? (
                      <span>
                        Search for <strong className="font-semibold">“{s}”</strong>
                      </span>
                    ) : (
                      s
                    )}
                  </span>
                  {i === active ? <CornerDownLeft className="size-4 text-muted" /> : <ArrowRight className="size-4 text-faint" />}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
