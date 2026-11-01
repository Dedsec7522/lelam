"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Calculator, Radar, ShieldCheck } from "lucide-react";
import { motionTokens } from "@/lib/motion";
import { LogoMark } from "@/components/ui/logo";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

const SLIDES = [
  { icon: Radar, title: "Every auction, one search", text: "MSTC catalogs and bank properties in a single plain-English search, with distance and EMD filters." },
  { icon: Calculator, title: "Know your landed cost", text: "GST under reverse charge, TCS, transport and loading, worked out for every lot before you bid." },
  { icon: ShieldCheck, title: "Walk in prepared", text: "Compliance checklists, document vault and reminders so inspection and EMD deadlines never slip." },
];

const INTERVAL_MS = 5000;

/** Rotating value propositions with progress indicators; pauses under reduced motion. */
export function AuthShowcase() {
  const [i, setI] = useState(0);
  const reduce = useSafeReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const t = window.setInterval(() => setI((x) => (x + 1) % SLIDES.length), INTERVAL_MS);
    return () => window.clearInterval(t);
  }, [reduce]);

  const slide = SLIDES[i];
  return (
    <div className="max-w-md">
      <LogoMark className="size-12" />
      <p className="mt-8 text-[2.4rem] font-semibold leading-[1.05] tracking-[-0.03em]">
        Bid with the <span className="font-serif font-normal italic text-copper">numbers</span> already done.
      </p>
      <div className="relative mt-10 h-36" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, y: reduce ? 0 : motionTokens.distance.md }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : -motionTokens.distance.sm }}
            transition={{ duration: motionTokens.duration.normal, ease: motionTokens.easing.smooth }}
            className="absolute inset-0"
          >
            <slide.icon className="size-6 text-copper" aria-hidden />
            <p className="mt-3 text-lg font-semibold">{slide.title}</p>
            <p className="mt-1.5 text-[0.95rem] leading-relaxed text-paper/70">{slide.text}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="mt-4 flex gap-2" role="tablist" aria-label="Highlights">
        {SLIDES.map((s, idx) => (
          <button
            key={s.title}
            type="button"
            role="tab"
            aria-selected={idx === i}
            aria-label={s.title}
            onClick={() => setI(idx)}
            className="relative h-1.5 w-10 overflow-hidden rounded-full bg-paper/20"
          >
            {idx === i && (
              <motion.span
                key={`bar-${i}`}
                className="absolute inset-0 origin-left rounded-full bg-paper"
                initial={{ scaleX: reduce ? 1 : 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: reduce ? 0 : INTERVAL_MS / 1000, ease: "linear" }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
