"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { CATEGORIES } from "@/lib/taxonomy";
import { motionTokens, staggerContainer } from "@/lib/motion";
import { Logo } from "@/components/ui/logo";
import { CloseButton, useModalBehaviour } from "@/components/ui/dialog";
import { ButtonLink } from "@/components/ui/button";
import { useSession } from "@/components/session";
import { CATEGORY_ICONS, RESOURCES } from "./nav-config";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

const PRIMARY = [
  { href: "/", label: "Home" },
  { href: "/auctions", label: "Marketplace" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

/** Full-screen sheet menu for < lg screens. Circular clip reveal from the trigger corner. */
export function MobileMenu({ open, onClose, onSearch }: { open: boolean; onClose: () => void; onSearch: () => void }) {
  const pathname = usePathname();
  const reduce = useSafeReducedMotion();
  const { user, signOut } = useSession();
  const panel = useRef<HTMLDivElement>(null);
  const lastPath = useRef(pathname);

  useEffect(() => {
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      onClose();
    }
  }, [pathname, onClose]);

  // Shared focus trap, Escape, scroll lock and focus restore.
  useModalBehaviour(open, onClose, panel);

  if (typeof document === "undefined") return null;

  const item = {
    hidden: { opacity: 0, y: reduce ? 0 : motionTokens.distance.md },
    visible: { opacity: 1, y: 0, transition: { duration: motionTokens.duration.normal, ease: motionTokens.easing.smooth } },
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="fixed inset-0 z-[85] flex flex-col bg-paper lg:hidden"
          initial={reduce ? { opacity: 0 } : { clipPath: "circle(0% at 100% 0%)" }}
          animate={reduce ? { opacity: 1 } : { clipPath: "circle(150% at 100% 0%)" }}
          exit={reduce ? { opacity: 0 } : { clipPath: "circle(0% at 100% 0%)" }}
          transition={{ duration: reduce ? motionTokens.duration.fast : motionTokens.duration.slow, ease: motionTokens.easing.smooth }}
        >
          <div className="container-page flex h-[72px] items-center justify-between border-b border-line">
            <Logo />
            <CloseButton onClick={onClose} label="Close menu" />
          </div>
          <motion.div
            className="container-page flex-1 overflow-y-auto pb-10 pt-6"
            initial="hidden"
            animate="visible"
            variants={staggerContainer(motionTokens.stagger.tight, 0.12)}
          >
            <motion.button
              variants={item}
              type="button"
              onClick={() => {
                onClose();
                onSearch();
              }}
              className="flex h-12 w-full items-center gap-3 rounded-2xl border border-line bg-surface px-4 text-left text-muted"
            >
              <Search className="size-4" /> Search auctions in plain English
            </motion.button>

            <nav aria-label="Mobile" className="mt-6">
              <ul>
                {PRIMARY.map((l) => {
                  const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
                  return (
                    <motion.li key={l.href} variants={item} className="border-b border-line">
                      <Link
                        href={l.href}
                        aria-current={active ? "page" : undefined}
                        className={cn("flex items-center justify-between py-4 text-[1.6rem] font-semibold tracking-tight", active ? "text-brand" : "text-ink")}
                      >
                        {l.label}
                        <ArrowRight className="size-5 text-faint" />
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>
            </nav>

            <motion.p variants={item} className="eyebrow mb-3 mt-8">
              Categories
            </motion.p>
            <motion.div variants={item} className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((c) => {
                const Icon = CATEGORY_ICONS[c.id];
                return (
                  <Link key={c.id} href={`/auctions?category=${c.id}`} className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-3 text-sm font-medium text-ink">
                    <Icon className="size-4 text-brand" aria-hidden />
                    {c.short}
                  </Link>
                );
              })}
            </motion.div>

            <motion.p variants={item} className="eyebrow mb-3 mt-8">
              Resources
            </motion.p>
            <motion.div variants={item} className="grid grid-cols-2 gap-2">
              {RESOURCES.map((r) => (
                <Link key={r.href} href={r.href} className="rounded-xl px-1 py-2 text-[0.95rem] text-ink-2">
                  {r.label}
                </Link>
              ))}
            </motion.div>

            <motion.div variants={item} className="mt-8 grid gap-2">
              {user ? (
                <>
                  <ButtonLink href="/dashboard" size="lg" className="w-full">
                    Go to dashboard
                  </ButtonLink>
                  <button type="button" onClick={() => void signOut()} className="h-12 rounded-2xl text-sm font-medium text-danger">
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <ButtonLink href="/auth/register" size="lg" className="w-full">
                    Create free account
                  </ButtonLink>
                  <ButtonLink href="/auth/login" size="lg" variant="secondary" className="w-full">
                    Sign in
                  </ButtonLink>
                </>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
