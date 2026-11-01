"use client";

import { useReducedMotion } from "motion/react";
import { useHydrated } from "./use-stored-state";

/**
 * Hydration-safe reduced-motion flag.
 *
 * `useReducedMotion()` reads the OS setting on the client, but the server can't, so using it to
 * pick initial styles makes SSR and the first client render disagree (hydration mismatch).
 * This returns `false` until hydration, then the real preference. Reduced-motion users are
 * still protected from the first frame: `MotionConfig reducedMotion="user"` (MotionProvider)
 * makes Motion skip transform/layout animation for them.
 */
export function useSafeReducedMotion(): boolean {
  const prefersReduced = useReducedMotion();
  const hydrated = useHydrated();
  return hydrated && !!prefersReduced;
}
