"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, LocateFixed, Search, ShieldCheck, TrendingUp } from "lucide-react";
import { formatINR } from "@/lib/format";
import { motionTokens, springs, staggerContainer } from "@/lib/motion";
import { SEARCH_EXAMPLES, parseQuery } from "@/lib/search";
import { WordReveal } from "@/components/motion/reveal";
import { CountUp } from "@/components/motion/count-up";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

const fadeIn = {
  hidden: { opacity: 0, y: motionTokens.distance.md },
  visible: { opacity: 1, y: 0, transition: { duration: motionTokens.duration.slow, ease: motionTokens.easing.smooth } },
};

const formatCrore = (n: number) => `₹${Math.round(n)} Cr`;

export function Hero({ stats }: { stats: { lots: number; open: number; states: number; value: number } }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useSafeReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const cardY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -60]);
  const chipY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -120]);
  const gridY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 80]);

  return (
    <section ref={ref} className="relative isolate overflow-hidden pb-20 pt-10 sm:pt-16 lg:pb-28">
      <div className="hero-glow absolute inset-0 -z-20" aria-hidden />
      <motion.div style={{ y: gridY }} className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_30%_20%,black_30%,transparent_75%)]" aria-hidden />
      <ContourLines />

      <div className="container-page grid items-center gap-14 lg:grid-cols-[1.08fr_1fr] lg:gap-10">
        <motion.div initial="hidden" animate="visible" variants={staggerContainer(motionTokens.stagger.loose, 0.05)}>
          <motion.p variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3 py-1.5 text-[0.78rem] font-medium text-ink-2 backdrop-blur">
            <span className="size-1.5 rounded-full bg-copper text-copper animate-pulse-dot" aria-hidden />
            <span>
              <CountUp value={stats.open} /> auctions open across India
            </span>
          </motion.p>

          <WordReveal
            text="Every public auction in India, priced before you bid."
            accentWords={["priced"]}
            accentClassName="font-serif italic font-normal text-brand tracking-normal"
            delay={0.15}
            className="mt-6 text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.035em] text-ink sm:text-[3.6rem] lg:text-[4.1rem]"
          />

          <motion.p variants={fadeIn} className="mt-6 max-w-xl text-[1.08rem] leading-relaxed text-muted">
            Lelam brings MSTC and bank auctions into one search, reads every catalog, and works out landed cost, GST and margin.
            You walk into the portal knowing your number.
          </motion.p>

          <motion.div variants={fadeIn} className="mt-8">
            <HeroSearch />
          </motion.div>

          <motion.dl variants={fadeIn} className="mt-10 grid max-w-lg grid-cols-3 divide-x divide-line border-y border-line">
            {[
              { label: "Lots tracked", value: <CountUp value={stats.lots} /> },
              { label: "States", value: <CountUp value={stats.states} /> },
              { label: "Value listed", value: <CountUp value={stats.value / 1e7} format={formatCrore} /> },
            ].map((s) => (
              <div key={s.label} className="px-4 py-4 first:pl-0">
                <dt className="eyebrow text-[0.64rem]">{s.label}</dt>
                <dd className="mt-1 font-mono text-xl font-medium tabular-nums text-ink">{s.value}</dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>

        <div className="relative">
          <motion.div style={{ y: cardY }}>
            <LotLedger />
          </motion.div>
          <motion.div
            style={{ y: chipY }}
            initial={{ opacity: 0, x: reduce ? 0 : -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springs.gentle, delay: 1.1 }}
            className="absolute -left-4 bottom-10 hidden items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-md sm:flex lg:-left-10"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-positive-soft text-positive">
              <TrendingUp className="size-[18px]" aria-hidden />
            </span>
            <span>
              <span className="block text-[0.7rem] text-muted">Projected margin</span>
              <span className="block font-mono text-sm font-semibold text-positive">+28.2%</span>
            </span>
          </motion.div>
          <motion.div
            style={{ y: chipY }}
            initial={{ opacity: 0, x: reduce ? 0 : 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springs.gentle, delay: 1.3 }}
            className="absolute -right-3 -top-5 hidden items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-[0.78rem] font-medium text-ink-2 shadow-md sm:flex"
          >
            <ShieldCheck className="size-4 text-brand" aria-hidden />
            Compliance checked · 3 items
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function HeroSearch() {
  const router = useRouter();
  const reduce = useSafeReducedMotion();
  const [q, setQ] = useState("");
  const [placeholder, setPlaceholder] = useState(SEARCH_EXAMPLES[0]);
  const [focused, setFocused] = useState(false);

  // Typewriter placeholder: types, holds, deletes, advances. Static under reduced motion or while focused.
  useEffect(() => {
    if (reduce || focused || q) return;
    let idx = 0;
    let len = 0;
    let phase: "type" | "hold" | "delete" = "type";
    let timer: number;
    const tick = () => {
      const text = SEARCH_EXAMPLES[idx];
      if (phase === "type") {
        len += 1;
        setPlaceholder(text.slice(0, len));
        if (len >= text.length) phase = "hold";
        timer = window.setTimeout(tick, len >= text.length ? 2000 : 55);
      } else if (phase === "hold") {
        phase = "delete";
        timer = window.setTimeout(tick, 30);
      } else {
        len -= 1;
        setPlaceholder(text.slice(0, Math.max(0, len)));
        if (len <= 0) {
          phase = "type";
          idx = (idx + 1) % SEARCH_EXAMPLES.length;
        }
        timer = window.setTimeout(tick, 22);
      }
    };
    timer = window.setTimeout(tick, 900);
    return () => window.clearTimeout(timer);
  }, [reduce, focused, q]);

  function submit(text: string) {
    const value = text.trim();
    const params = new URLSearchParams();
    if (value) params.set("q", value);
    if (value && parseQuery(value).nearMe) params.set("near", "1");
    router.push(`/auctions${params.size ? `?${params}` : ""}`);
  }

  return (
    <div>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit(q);
        }}
        className="group flex h-16 items-center gap-2 rounded-2xl border border-line-strong bg-surface p-2 pl-5 shadow-md transition-[border-color,box-shadow] focus-within:border-brand focus-within:shadow-lg"
      >
        <Search className="size-5 shrink-0 text-muted" aria-hidden />
        <label htmlFor="hero-search" className="sr-only">
          Search auctions in plain English
        </label>
        <input
          id="hero-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={focused ? "Material, place, distance…" : placeholder}
          autoComplete="off"
          className="h-full min-w-0 flex-1 bg-transparent text-[1rem] text-ink placeholder:text-faint focus:outline-none"
        />
        <button type="submit" className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-ink px-5 text-sm font-medium text-paper transition-colors hover:bg-ink-2">
          <span className="hidden sm:inline">Search</span>
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </form>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.8rem]">
        <button
          type="button"
          onClick={() => submit("auctions near me")}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-surface/70 px-3 py-1.5 text-ink-2 transition-colors hover:border-brand hover:text-brand"
        >
          <LocateFixed className="size-3.5" aria-hidden /> Near me
        </button>
        {["Copper scrap", "Bank property", "End-of-life vehicles"].map((s) => (
          <Link
            key={s}
            href={`/auctions?q=${encodeURIComponent(s)}`}
            className="inline-flex min-h-9 items-center rounded-full border border-line bg-surface/70 px-3 py-1.5 text-ink-2 transition-colors hover:border-brand hover:text-brand"
          >
            {s}
          </Link>
        ))}
      </div>
    </div>
  );
}

const LEDGER_ROWS = [
  { lot: "01/24", desc: "Copper winding wire", qty: "3.20 MT", value: 2_112_000 },
  { lot: "02/24", desc: "Copper bus bar", qty: "1.45 MT", value: 1_000_500 },
  { lot: "03/24", desc: "Brass valves & fittings", qty: "0.80 MT", value: 320_000 },
  { lot: "04/24", desc: "Mixed copper scrap", qty: "2.10 MT", value: 1_239_000 },
];

const COST_PARTS = [
  { label: "Bid", value: 62, tone: "bg-ink" },
  { label: "GST (RCM)", value: 18, tone: "bg-brand" },
  { label: "TCS", value: 4, tone: "bg-copper" },
  { label: "Transport", value: 11, tone: "bg-faint" },
  { label: "Loading", value: 5, tone: "bg-line-strong" },
];

/** Illustrative analysis card: shows what Lelam produces for a lot. */
function LotLedger() {
  const reduce = useSafeReducedMotion();
  const total = LEDGER_ROWS.reduce((s, r) => s + r.value, 0);
  const row = {
    hidden: { opacity: 0, x: reduce ? 0 : 12 },
    visible: { opacity: 1, x: 0, transition: { duration: motionTokens.duration.normal, ease: motionTokens.easing.smooth } },
  };

  return (
    <motion.figure
      initial={{ opacity: 0, y: reduce ? 0 : 28, rotate: reduce ? 0 : 1.5 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ ...springs.gentle, delay: 0.25 }}
      className="relative mx-auto w-full max-w-[520px] rounded-[28px] border border-line bg-surface p-2 shadow-lg"
      aria-label="Example: Lelam's analysis of a copper scrap auction"
    >
      <div className="rounded-[22px] border border-line bg-surface-2">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <p className="eyebrow text-[0.62rem]">MSTC · Visakhapatnam · Example</p>
            <p className="mt-1 font-semibold text-ink">Copper & brass scrap</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-copper-soft px-2.5 py-1 text-[0.72rem] font-medium text-copper">
            <span className="size-1.5 rounded-full bg-current animate-pulse-dot" aria-hidden /> Opens in 2d 4h
          </span>
        </div>

        <motion.ul initial="hidden" animate="visible" variants={staggerContainer(motionTokens.stagger.loose, 0.6)} className="divide-y divide-line px-5">
          {LEDGER_ROWS.map((r) => (
            <motion.li key={r.lot} variants={row} className="grid grid-cols-[3.2rem_1fr_auto] items-center gap-3 py-3 text-sm">
              <span className="font-mono text-[0.72rem] text-faint">{r.lot}</span>
              <span className="min-w-0">
                <span className="block truncate font-medium text-ink">{r.desc}</span>
                <span className="block text-[0.75rem] text-muted">{r.qty}</span>
              </span>
              <span className="font-mono text-[0.82rem] tabular-nums text-ink-2">{formatINR(r.value, { compact: true })}</span>
            </motion.li>
          ))}
        </motion.ul>

        <div className="border-t border-line px-5 py-4">
          <div className="flex items-baseline justify-between text-[0.78rem]">
            <span className="text-muted">Landed cost breakdown</span>
            <span className="font-mono text-ink-2">{formatINR(total * 0.94, { compact: true })}</span>
          </div>
          <div className="mt-2.5 flex h-2.5 gap-0.5 overflow-hidden rounded-full" aria-hidden>
            {COST_PARTS.map((p, i) => (
              <motion.span
                key={p.label}
                className={`${p.tone} h-full origin-left`}
                style={{ width: `${p.value}%` }}
                initial={{ scaleX: reduce ? 1 : 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: motionTokens.duration.slow, ease: motionTokens.easing.smooth, delay: 1.2 + i * motionTokens.stagger.normal }}
              />
            ))}
          </div>
          <ul className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[0.7rem] text-muted">
            {COST_PARTS.map((p) => (
              <li key={p.label} className="flex items-center gap-1.5">
                <span className={`size-2 rounded-sm ${p.tone}`} aria-hidden />
                {p.label} {p.value}%
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-3 divide-x divide-line border-t border-line">
          {[
            { k: "Resale value", v: formatINR(total, { compact: true }) },
            { k: "Predicted close", v: formatINR(total * 0.78, { compact: true }) },
            { k: "ROI", v: "+28.2%", positive: true },
          ].map((s) => (
            <div key={s.k} className="px-4 py-3.5">
              <p className="text-[0.68rem] text-muted">{s.k}</p>
              <p className={`mt-0.5 font-mono text-[0.95rem] font-semibold tabular-nums ${s.positive ? "text-positive" : "text-ink"}`}>{s.v}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.figure>
  );
}

/** Slow-drifting topographic lines: a quiet "price contour" texture behind the hero. */
function ContourLines() {
  return (
    // Fade horizontally: softer behind the text column (keeps copy readable), full strength on the open right.
    <div
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px] overflow-hidden [mask-image:linear-gradient(to_right,rgb(0_0_0/0.45),black_55%)]"
      aria-hidden
    >
      <div className="flex h-full w-[200%] motion-safe:animate-drift">
        {[0, 1].map((k) => (
          <svg key={k} viewBox="0 0 1200 600" className="h-full w-1/2" preserveAspectRatio="none">
            {Array.from({ length: 9 }, (_, i) => (
              <motion.path
                key={i}
                d={`M0 ${380 + i * 22} C 200 ${300 + i * 18}, 400 ${460 + i * 14}, 600 ${360 + i * 20} S 1000 ${300 + i * 24}, 1200 ${380 + i * 22}`}
                fill="none"
                stroke="var(--contour)"
                strokeWidth="1.1"
                // Draw each line in on load, top to bottom, then let the CSS drift take over.
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 - i * 0.08 }}
                transition={{ duration: motionTokens.duration.crawl * 1.6, ease: motionTokens.easing.smooth, delay: 0.2 + i * motionTokens.stagger.normal }}
              />
            ))}
          </svg>
        ))}
      </div>
    </div>
  );
}
