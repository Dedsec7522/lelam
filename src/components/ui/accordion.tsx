"use client";

import { useId, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { motionTokens, springs } from "@/lib/motion";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

export interface AccordionItem {
  id: string;
  title: ReactNode;
  content: ReactNode;
}

/**
 * Disclosure list (WAI-ARIA accordion pattern). Height is animated with a grid-rows
 * trick on the wrapper rather than animating `height` directly, so motion stays on the
 * compositor-friendly path and content is never clipped for screen readers.
 */
export function Accordion({
  items,
  defaultOpen,
  multiple = false,
  className,
}: {
  items: AccordionItem[];
  defaultOpen?: string;
  multiple?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState<string[]>(defaultOpen ? [defaultOpen] : []);
  const base = useId();
  const reduce = useSafeReducedMotion();

  const toggle = (id: string) =>
    setOpen((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : multiple ? [...cur, id] : [id]));

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {items.map((item) => {
        const isOpen = open.includes(item.id);
        const btnId = `${base}-${item.id}-btn`;
        const panelId = `${base}-${item.id}-panel`;
        return (
          <div
            key={item.id}
            id={item.id}
            className={cn(
              "scroll-mt-28 rounded-2xl border bg-surface transition-[border-color,box-shadow] duration-200",
              isOpen ? "border-brand/35 shadow-sm" : "border-line hover:border-line-strong",
            )}
          >
            <h3>
              <button
                id={btnId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className="flex w-full items-center justify-between gap-6 rounded-2xl px-5 py-4 text-left text-[1.02rem] font-medium text-ink sm:px-6 sm:py-5"
              >
                <span>{item.title}</span>
                <motion.span
                  aria-hidden
                  animate={{ rotate: isOpen ? 45 : 0 }}
                  transition={reduce ? { duration: 0 } : springs.snappy}
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full border transition-colors",
                    isOpen ? "border-brand bg-brand text-on-brand" : "border-line-strong text-muted",
                  )}
                >
                  <Plus className="size-4" />
                </motion.span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={btnId}
                  initial={{ gridTemplateRows: "0fr", opacity: 0 }}
                  animate={{ gridTemplateRows: "1fr", opacity: 1 }}
                  exit={{ gridTemplateRows: "0fr", opacity: 0 }}
                  transition={{ duration: reduce ? 0 : motionTokens.duration.normal, ease: motionTokens.easing.smooth }}
                  className="grid"
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 text-[0.97rem] leading-relaxed text-muted sm:px-6 sm:pb-6">{item.content}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
