"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import { motionTokens } from "@/lib/motion";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

// The first server-rendered page is shown immediately (no hidden SSR content, no hydration mismatch);
// only subsequent client-side navigations get the entrance transition.
let hasMounted = false;

export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  const reduce = useSafeReducedMotion();
  const animateIn = hasMounted;

  useEffect(() => {
    hasMounted = true;
  }, []);

  return (
    <motion.div
      initial={animateIn ? { opacity: 0, y: reduce ? 0 : motionTokens.distance.sm } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: motionTokens.duration.normal, ease: motionTokens.easing.smooth }}
    >
      {children}
    </motion.div>
  );
}
