"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { BookOpen, Gavel, Heart, Home, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";
import { springs } from "@/lib/motion";
import { useSession } from "@/components/session";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

/** Bottom tab bar for phones (5 destinations max). */
export function TabBar() {
  const pathname = usePathname();
  const { user } = useSession();
  const reduce = useSafeReducedMotion();
  const tabs = [
    { href: "/", label: "Home", icon: Home },
    { href: "/auctions", label: "Auctions", icon: Gavel },
    { href: user ? "/dashboard/interested" : "/auth/login?redirect=/dashboard/interested", match: "/dashboard/interested", label: "Saved", icon: Heart },
    { href: "/blog", label: "Insights", icon: BookOpen },
    { href: user ? "/dashboard" : "/auth/login", match: "/dashboard", label: user ? "Account" : "Sign in", icon: UserRound },
  ];

  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {tabs.map((t) => {
          const target = t.match ?? t.href;
          const active =
            target === "/" ? pathname === "/" : target === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(target);
          return (
            <li key={t.label}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn("relative flex h-16 flex-col items-center justify-center gap-1 text-[0.68rem] font-medium", active ? "text-ink" : "text-muted")}
              >
                {active && (
                  <motion.span
                    layoutId="tabbar-active"
                    transition={reduce ? { duration: 0 } : springs.layout}
                    className="absolute top-0 h-[3px] w-8 rounded-b-full bg-brand"
                    aria-hidden
                  />
                )}
                <t.icon className={cn("size-[20px]", active && "text-brand")} aria-hidden />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
