"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { drawerLeft, drawerRight, fadeOnly, overlayFade, panelPop } from "@/lib/motion";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Focus trap + Escape + scroll lock + focus restore shared by every modal surface.
 * `onClose` is read through a ref so parents passing inline callbacks don't re-run the
 * effect (which would steal focus and re-capture the restore target on every render).
 */
export function useModalBehaviour(open: boolean, onClose: () => void, panel: React.RefObject<HTMLElement | null>) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => {
      const el = panel.current;
      const first = el?.querySelector<HTMLElement>("[data-autofocus]") ?? el?.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? el)?.focus();
    });
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const nodes = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open, panel]);
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  className,
  hideHeader,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  hideHeader?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const reduce = useSafeReducedMotion();
  useModalBehaviour(open, onClose, panel);
  if (typeof document === "undefined") return null;

  const widths = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-6xl" };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-ink/45 backdrop-blur-[3px]"
            variants={overlayFade}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={hideHeader ? title : undefined}
            aria-labelledby={hideHeader ? undefined : "dialog-title"}
            tabIndex={-1}
            variants={reduce ? fadeOnly : panelPop}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              "relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-lg outline-none sm:rounded-3xl",
              widths[size],
              className,
            )}
          >
            {!hideHeader && (
              <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
                <div>
                  <h2 id="dialog-title" className="text-lg font-semibold text-ink">
                    {title}
                  </h2>
                  {description && <p className="mt-1 text-sm text-muted">{description}</p>}
                </div>
                <CloseButton onClick={onClose} />
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function Drawer({
  open,
  onClose,
  title,
  side = "right",
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: "left" | "right";
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const reduce = useSafeReducedMotion();
  useModalBehaviour(open, onClose, panel);
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80]">
          <motion.div
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            variants={overlayFade}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
            tabIndex={-1}
            variants={reduce ? fadeOnly : side === "right" ? drawerRight : drawerLeft}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              "absolute top-0 flex h-full w-[min(420px,92vw)] flex-col border-line bg-surface shadow-lg outline-none",
              side === "right" ? "right-0 border-l" : "left-0 border-r",
              className,
            )}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 id="drawer-title" className="text-base font-semibold text-ink">
                {title}
              </h2>
              <CloseButton onClick={onClose} />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>
            {footer && <div className="border-t border-line px-5 py-4">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function CloseButton({ onClick, label = "Close" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-10 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-paper-2 hover:text-ink"
    >
      <X className="size-5" />
    </button>
  );
}
