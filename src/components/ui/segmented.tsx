"use client";

import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { springs } from "@/lib/motion";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
}

/**
 * Segmented control / tab list with a shared-layout sliding indicator.
 * Implements the ARIA tabs keyboard model (arrow keys, Home/End).
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  size = "md",
  className,
  controls,
  variant = "tabs",
}: {
  /** "tabs" when it switches panels; "radio" when it just picks a value. */
  variant?: "tabs" | "radio";
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  size?: "sm" | "md";
  className?: string;
  /** id prefix of tabpanels, when used as tabs */
  controls?: string;
}) {
  const layoutId = useId();
  const reduce = useSafeReducedMotion();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  function onKey(e: KeyboardEvent, index: number) {
    let next = index;
    if (e.key === "ArrowRight") next = (index + 1) % options.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + options.length) % options.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = options.length - 1;
    else return;
    e.preventDefault();
    onChange(options[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div
      role={variant === "tabs" ? "tablist" : "radiogroup"}
      aria-label={label}
      className={cn("inline-flex rounded-full border border-line bg-paper-2 p-1", className)}
    >
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role={variant === "tabs" ? "tab" : "radio"}
            type="button"
            aria-selected={variant === "tabs" ? active : undefined}
            aria-checked={variant === "radio" ? active : undefined}
            aria-controls={variant === "tabs" && controls ? `${controls}-${opt.value}` : undefined}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              "relative inline-flex items-center gap-2 whitespace-nowrap rounded-full font-medium transition-colors duration-200",
              size === "sm" ? "h-8 px-3.5 text-[0.82rem]" : "h-10 px-5 text-sm",
              active ? "text-paper" : "text-muted hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={reduce ? { duration: 0 } : springs.layout}
                className="absolute inset-0 rounded-full bg-ink shadow-sm"
                aria-hidden
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-2">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
