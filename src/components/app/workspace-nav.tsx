"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId } from "react";
import { motion } from "motion/react";
import {
  Bell,
  BellRing,
  Bookmark,
  Boxes,
  CirclePlus,
  ClipboardList,
  Contact,
  FileText,
  Gavel,
  LayoutDashboard,
  ListChecks,
  Lock,
  ReceiptText,
  ShieldCheck,
  Store,
  Truck,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { springs } from "@/lib/motion";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

export const NAV_ICONS = {
  overview: LayoutDashboard,
  watchlist: Bookmark,
  bids: Gavel,
  reminders: BellRing,
  documents: FileText,
  inventory: Boxes,
  vendors: Contact,
  quotes: ReceiptText,
  shipping: Truck,
  notifications: Bell,
  profile: UserCog,
  seller: Store,
  logistics: Truck,
  admin: ShieldCheck,
  list: ListChecks,
  create: CirclePlus,
  requests: ClipboardList,
} satisfies Record<string, LucideIcon>;

export type NavIcon = keyof typeof NAV_ICONS;

export interface NavItem {
  href: string;
  label: string;
  icon: NavIcon;
  /** Shown with a lock when the plan does not include the tool. */
  locked?: boolean;
  /** Only highlight on an exact match (for section roots like /dashboard). */
  exact?: boolean;
  badge?: number;
}

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/**
 * Workspace navigation: vertical sidebar on large screens, horizontally scrolling chips on
 * small screens. The active pill slides between items with a shared layout animation.
 */
export function WorkspaceNav({ items, label, secondary }: { items: NavItem[]; label: string; secondary?: NavItem[] }) {
  const pathname = usePathname();
  const reduce = useSafeReducedMotion();
  const id = useId();
  const all = [...items, ...(secondary ?? [])];
  // Most specific match wins so /dashboard/quotes/new highlights Quotes, not Overview.
  const active = all
    .filter((i) => isActive(pathname, i))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const renderItem = (item: NavItem, variant: "side" | "chip") => {
    const Icon = NAV_ICONS[item.icon];
    const on = item.href === active;
    return (
      <li key={item.href} className={variant === "chip" ? "shrink-0" : undefined}>
        <Link
          href={item.href}
          aria-current={on ? "page" : undefined}
          className={cn(
            "relative flex min-h-11 items-center gap-3 rounded-xl text-sm font-medium transition-colors duration-200",
            variant === "side" ? "px-3" : "border border-line bg-surface px-3.5",
            on ? "text-ink" : "text-muted hover:bg-paper-2 hover:text-ink",
            variant === "chip" && on && "border-transparent",
          )}
        >
          {on && (
            <motion.span
              layoutId={`${id}-${variant}`}
              transition={reduce ? { duration: 0 } : springs.layout}
              className={cn("absolute inset-0 rounded-xl", variant === "side" ? "bg-paper-2" : "bg-brand-soft")}
              aria-hidden
            />
          )}
          {on && variant === "side" && (
            <motion.span
              layoutId={`${id}-bar`}
              transition={reduce ? { duration: 0 } : springs.layout}
              className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-brand"
              aria-hidden
            />
          )}
          <Icon className={cn("relative size-[18px] shrink-0", on && "text-brand")} aria-hidden />
          <span className="relative">{item.label}</span>
          {item.locked && <Lock className="relative ml-auto size-3.5 text-faint" aria-label="Upgrade required" />}
          {!item.locked && item.badge ? (
            <span className="relative ml-auto rounded-full bg-copper px-1.5 text-[0.7rem] font-semibold leading-5 text-on-copper">
              {item.badge > 99 ? "99+" : item.badge}
              <span className="sr-only"> unread</span>
            </span>
          ) : null}
        </Link>
      </li>
    );
  };

  return (
    <nav aria-label={label}>
      {/* Mobile / tablet: scrollable chip row */}
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
        {all.map((i) => renderItem(i, "chip"))}
      </ul>
      {/* Desktop sidebar */}
      <ul className="hidden flex-col gap-0.5 lg:flex">{items.map((i) => renderItem(i, "side"))}</ul>
      {secondary && secondary.length > 0 && (
        <>
          <p className="eyebrow mb-2 mt-6 hidden px-3 text-[0.66rem] lg:block">Portals</p>
          <ul className="hidden flex-col gap-0.5 lg:flex">{secondary.map((i) => renderItem(i, "side"))}</ul>
        </>
      )}
    </nav>
  );
}
