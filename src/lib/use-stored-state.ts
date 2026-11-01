"use client";

import { useCallback, useSyncExternalStore } from "react";

const EVENT = "lelam-storage";

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Per-browser preference backed by localStorage. Renders `fallback` on the server and first
 * client pass (no hydration mismatch), then the stored value. Survives blocked storage.
 */
export function useStoredState<T extends string>(key: string, fallback: T, allowed: readonly T[]): [T, (v: T) => void] {
  const raw = useSyncExternalStore(subscribe, () => readRaw(key), () => null);
  const value = raw !== null && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
  const set = useCallback(
    (v: T) => {
      try {
        localStorage.setItem(key, v);
      } catch {
        /* storage blocked: preference applies to this view only */
      }
      window.dispatchEvent(new Event(EVENT));
    },
    [key],
  );
  return [value, set];
}

/** True after hydration; false during SSR and the hydration pass. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}
