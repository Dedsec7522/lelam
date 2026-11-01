"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "motion/react";
import { motionTokens } from "@/lib/motion";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

/**
 * Counts from 0 to `value` when scrolled into view. Server and first paint render the final
 * value, so there is no hydration mismatch and no blank number for crawlers or no-JS users.
 */
// Stable identity: an inline default would change every render and restart the animation.
const formatInteger = (n: number) => Math.round(n).toLocaleString("en-IN");

export function CountUp({
  value,
  format = formatInteger,
  className,
  duration = motionTokens.duration.crawl,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useSafeReducedMotion();
  const [display, setDisplay] = useState(() => format(value));

  // `inView` latches (once: true), so this runs once per mount. No extra "started" guard:
  // under StrictMode the effect re-runs after cleanup, and a guard would leave the count frozen.
  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, value, {
      duration,
      ease: motionTokens.easing.smooth,
      onUpdate: (v) => setDisplay(format(v)),
    });
    return () => {
      controls.stop();
      setDisplay(format(value));
    };
  }, [inView, reduce, value, duration, format]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
