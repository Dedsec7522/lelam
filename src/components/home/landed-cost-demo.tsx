"use client";

import { useId, useMemo, useState } from "react";
import { motion } from "motion/react";
import { computeLandedCost } from "@/lib/costing";
import { formatINR } from "@/lib/format";
import { springs } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

/** Interactive landed-cost estimator: the core maths of the product, usable without an account. */
export function LandedCostDemo({ compact = false, initial }: { compact?: boolean; initial?: { bid: number; weight: number; distance: number; gst: number } }) {
  const [bid, setBid] = useState(initial?.bid ?? 500000);
  const [weight, setWeight] = useState(initial?.weight ?? 20);
  const [distance, setDistance] = useState(initial?.distance ?? 180);
  const [gst, setGst] = useState(initial?.gst ?? 18);
  const [itc, setItc] = useState(true);
  const reduce = useSafeReducedMotion();

  const cost = useMemo(
    () => computeLandedCost({ bid, gstRate: gst, tcsRate: 1, emdPercent: 10, weightTonnes: weight, distanceKm: distance, itcEligible: itc }),
    [bid, weight, distance, gst, itc],
  );
  const parts = [
    { label: "Winning bid", value: cost.bid, tone: "bg-ink" },
    { label: `GST ${gst}%`, value: cost.gst, tone: "bg-brand" },
    { label: "TCS 1%", value: cost.tcs, tone: "bg-copper" },
    { label: "Transport", value: cost.transport, tone: "bg-faint" },
    { label: "Loading", value: cost.loading, tone: "bg-line-strong" },
  ];
  const uplift = cost.bid ? ((cost.total - cost.bid) / cost.bid) * 100 : 0;

  return (
    <div className={cn("grid gap-6", !compact && "lg:grid-cols-[1fr_1.1fr] lg:gap-10")}>
      <div className="space-y-5">
        <Slider label="Your winning bid" value={bid} min={50000} max={5000000} step={10000} onChange={setBid} display={formatINR(bid)} />
        <Slider label="Total weight" value={weight} min={1} max={200} step={1} onChange={setWeight} display={`${weight} MT`} />
        <Slider label="Distance to your yard" value={distance} min={10} max={1500} step={10} onChange={setDistance} display={`${distance} km`} />
        <fieldset>
          <legend className="text-sm font-medium text-ink-2">GST rate</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {[5, 12, 18].map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={gst === r}
                onClick={() => setGst(r)}
                className={cn(
                  "h-9 rounded-full border px-4 text-sm font-medium transition-colors",
                  gst === r ? "border-ink bg-ink text-paper" : "border-line-strong text-ink-2 hover:border-ink/40",
                )}
              >
                {r}%
              </button>
            ))}
          </div>
        </fieldset>
        <label className="flex items-center gap-3 text-sm text-ink-2">
          <input type="checkbox" checked={itc} onChange={(e) => setItc(e.target.checked)} className="size-[18px] accent-[var(--brand)]" />
          I&apos;m GST-registered (claim input tax credit)
        </label>
      </div>

      <div className="rounded-3xl border border-line bg-surface p-6 shadow-sm" aria-live="polite">
        <p className="eyebrow">Landed cost</p>
        <p className="mt-2 font-mono text-[2.4rem] font-semibold leading-none tabular-nums tracking-tight text-ink">{formatINR(cost.total)}</p>
        <p className="mt-2 text-sm text-muted">
          <span className="font-medium text-copper">+{uplift.toFixed(1)}%</span> above your bid
          {itc && (
            <>
              {" "}
              · effective cost after ITC <span className="font-medium text-ink">{formatINR(cost.effectiveCost)}</span>
            </>
          )}
        </p>

        <div className="mt-6 flex h-3 gap-0.5 overflow-hidden rounded-full bg-paper-2" aria-hidden>
          {parts.map((p) => (
            <motion.span
              key={p.label}
              className={cn("h-full", p.tone)}
              animate={{ flexGrow: Math.max(p.value, 1) }}
              initial={false}
              transition={reduce ? { duration: 0 } : springs.gentle}
              style={{ flexBasis: 0 }}
            />
          ))}
        </div>

        <dl className="mt-5 divide-y divide-line text-sm">
          {parts.map((p) => (
            <div key={p.label} className="flex items-center justify-between py-2.5">
              <dt className="flex items-center gap-2 text-ink-2">
                <span className={cn("size-2.5 rounded-sm", p.tone)} aria-hidden />
                {p.label}
              </dt>
              <dd className="font-mono tabular-nums text-ink">{formatINR(p.value)}</dd>
            </div>
          ))}
          <div className="flex items-center justify-between py-2.5">
            <dt className="text-ink-2">EMD (10%, adjusted on win)</dt>
            <dd className="font-mono tabular-nums text-muted">{formatINR(cost.emd)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
}) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-medium text-ink-2">
          {label}
        </label>
        <output htmlFor={id} className="font-mono text-sm font-medium tabular-nums text-ink">
          {display}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full accent-[var(--brand)]"
        style={{ background: `linear-gradient(to right, var(--brand) ${pct}%, var(--paper-2) ${pct}%)` }}
      />
    </div>
  );
}
