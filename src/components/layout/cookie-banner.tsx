"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Cookie } from "lucide-react";
import { fadeOnly, panelPop } from "@/lib/motion";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

const KEY = "lelam-cookie-consent";

/** Essential-only by default; analytics stays off unless accepted. */
export function CookieBanner() {
  const [show, setShow] = useState(false);
  const reduce = useSafeReducedMotion();

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(KEY);
    } catch {
      /* storage blocked */
    }
    if (stored) return;
    const t = window.setTimeout(() => setShow(true), 1200);
    return () => window.clearTimeout(t);
  }, []);

  function choose(value: "all" | "essential") {
    try {
      localStorage.setItem(KEY, JSON.stringify({ value, at: new Date().toISOString() }));
    } catch {
      /* storage blocked: choice applies to this view only */
    }
    setShow(false);
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="region"
          aria-label="Cookie preferences"
          variants={reduce ? fadeOnly : panelPop}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed bottom-20 left-4 right-4 z-[70] rounded-2xl border border-line bg-surface p-4 shadow-lg sm:right-auto sm:max-w-sm lg:bottom-6 lg:left-6"
        >
          <div className="flex gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-paper-2 text-ink-2">
              <Cookie className="size-[18px]" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Cookies, kept minimal</p>
              <p className="mt-1 text-[0.82rem] leading-snug text-muted">
                We use essential cookies for sign-in and preferences. Optional analytics only run if you allow them.{" "}
                <Link href="/cookies" className="text-brand underline underline-offset-2">
                  Learn more
                </Link>
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => choose("essential")} className="h-10 rounded-xl border border-line-strong text-sm font-medium text-ink hover:bg-paper-2">
              Essential only
            </button>
            <button type="button" onClick={() => choose("all")} className="h-10 rounded-xl bg-ink text-sm font-medium text-paper hover:bg-ink-2">
              Allow all
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
