"use client";

import { useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Moon, Sun } from "lucide-react";
import { motionTokens } from "@/lib/motion";

export const THEME_KEY = "lelam-theme";

/** Runs before paint (inlined in <head>) so there is no light/dark flash. */
export const themeScript = `(function(){try{var k='${THEME_KEY}';var s=localStorage.getItem(k);var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=d?'dark':'light';}catch(e){document.documentElement.dataset.theme='light';}})();`;

// The <html data-theme> attribute is the source of truth; observe it as an external store.
function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}
const getTheme = () => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => null);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* storage unavailable (private mode) — theme still applies for this page view */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className="relative grid size-10 place-items-center overflow-hidden rounded-full text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink"
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={theme ?? "pending"}
          initial={{ y: 12, opacity: 0, rotate: -40 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -12, opacity: 0, rotate: 40 }}
          transition={{ duration: motionTokens.duration.fast, ease: motionTokens.easing.smooth }}
          className="grid place-items-center"
        >
          {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
