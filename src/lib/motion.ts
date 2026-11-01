/**
 * Motion tokens — the single source for durations, easings, distances and springs.
 * Component files must not hardcode timing values (ECC motion-foundations rules 5 & 6).
 */
import type { Transition, Variants } from "motion/react";

export const motionTokens = {
  duration: {
    instant: 0.08,
    fast: 0.18,
    normal: 0.32,
    slow: 0.6,
    crawl: 1.0,
  },
  easing: {
    smooth: [0.22, 1, 0.36, 1] as const,
    sharp: [0.4, 0, 0.2, 1] as const,
    exit: [0.4, 0, 1, 1] as const,
  },
  distance: { xs: 4, sm: 8, md: 16, lg: 24, xl: 48 },
  scale: { subtle: 0.98, press: 0.97, pop: 1.03 },
  stagger: { tight: 0.04, normal: 0.07, loose: 0.12 },
} as const;

export const springs = {
  snappy: { type: "spring", stiffness: 380, damping: 32 },
  gentle: { type: "spring", stiffness: 140, damping: 20 },
  layout: { type: "spring", stiffness: 420, damping: 36 },
  instant: { type: "spring", stiffness: 600, damping: 38 },
  release: { type: "spring", stiffness: 200, damping: 22, restDelta: 0.001 },
} as const satisfies Record<string, Transition>;

const { duration, easing, distance, stagger } = motionTokens;

/** Fade + rise, used by scroll reveals and page entrances. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: distance.md },
  visible: { opacity: 1, y: 0, transition: { duration: duration.slow, ease: easing.smooth } },
};

/** Reduced-motion counterpart: opacity only, ≤ 0.2s. */
export const fadeOnly: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.fast } },
};

export const staggerContainer = (each: number = stagger.normal, delayChildren = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: each, delayChildren } },
});

/** Word-level masked reveal for display headlines. */
export const wordReveal: Variants = {
  hidden: { y: "110%" },
  visible: { y: "0%", transition: { duration: duration.slow, ease: easing.smooth } },
};

export const overlayFade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.fast } },
  exit: { opacity: 0, transition: { duration: duration.fast, ease: easing.exit } },
};

export const panelPop: Variants = {
  hidden: { opacity: 0, y: distance.sm, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: springs.gentle },
  exit: { opacity: 0, y: distance.xs, scale: 0.99, transition: { duration: duration.fast, ease: easing.exit } },
};

export const dropdown: Variants = {
  hidden: { opacity: 0, y: -6, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: springs.instant },
  exit: { opacity: 0, y: -4, transition: { duration: duration.fast, ease: easing.exit } },
};

export const drawerRight: Variants = {
  hidden: { x: "100%" },
  visible: { x: 0, transition: springs.layout },
  exit: { x: "100%", transition: { duration: duration.normal, ease: easing.exit } },
};

export const drawerLeft: Variants = {
  hidden: { x: "-100%" },
  visible: { x: 0, transition: springs.layout },
  exit: { x: "-100%", transition: { duration: duration.normal, ease: easing.exit } },
};
