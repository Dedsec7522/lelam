"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import { Calculator, Gavel, ScanSearch } from "lucide-react";
import { springs } from "@/lib/motion";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

const STEPS = [
  {
    icon: ScanSearch,
    title: "Find",
    text: "One plain-English search across MSTC and bank auctions, filtered by material, place, distance and EMD.",
  },
  {
    icon: Calculator,
    title: "Value",
    text: "Lots are read from the catalog and priced. You see landed cost, predicted close and margin, plus the compliance you'll need.",
  },
  {
    icon: Gavel,
    title: "Bid",
    text: "Save, set reminders, prepare documents, then bid on the official portal with a walk-away price you trust.",
  },
];

/** Three-step process with a connector line that draws as the section scrolls into view. */
export function ProcessLine() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useSafeReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "center 45%"] });
  const scaleX = useSpring(scrollYProgress, springs.release);

  return (
    <div ref={ref} className="relative">
      <div className="absolute left-[16.6%] right-[16.6%] top-7 hidden h-px bg-line md:block" aria-hidden>
        <motion.div className="h-full origin-left bg-brand" style={{ scaleX: reduce ? 1 : scaleX }} />
      </div>
      <Stagger className="grid gap-10 md:grid-cols-3 md:gap-8">
        {STEPS.map((s, i) => (
          <StaggerItem key={s.title} className="relative text-center">
            <span className="relative mx-auto grid size-14 place-items-center rounded-2xl border border-line bg-surface text-brand shadow-sm">
              <s.icon className="size-6" aria-hidden />
              <span className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-ink font-mono text-[0.7rem] text-paper">{i + 1}</span>
            </span>
            <h3 className="mt-5 text-xl font-semibold text-ink">{s.title}</h3>
            <p className="mx-auto mt-2 max-w-xs text-[0.95rem] leading-relaxed text-muted">{s.text}</p>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
