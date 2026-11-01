"use client";

import { motion, useScroll, useSpring } from "motion/react";
import { springs } from "@/lib/motion";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

/** Thin bar pinned to the top of the viewport that fills as the page is read. */
export function ReadingProgress() {
  const reduce = useSafeReducedMotion();
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, springs.release);
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-brand"
      style={{ scaleX: reduce ? scrollYProgress : smooth }}
    />
  );
}
