"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { ArrowRight, ChevronDown, LayoutDashboard, LogOut, Menu, Search, Settings, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";
import { CATEGORIES } from "@/lib/taxonomy";
import { dropdown, springs } from "@/lib/motion";
import { Logo } from "@/components/ui/logo";
import { ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme";
import { useSession } from "@/components/session";
import { CATEGORY_ICONS, QUICK_SEARCHES, RESOURCES } from "./nav-config";
import { MobileMenu } from "./mobile-menu";
import { SearchPalette } from "./search-palette";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

type MenuId = "market" | "resources" | "account" | null;

const LINKS = [
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const pathname = usePathname();
  const { user, status, signOut } = useSession();
  const [menu, setMenu] = useState<MenuId>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const reduce = useSafeReducedMotion();
  const { scrollY } = useScroll();
  const closeTimer = useRef<number | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const accountBtn = useRef<HTMLButtonElement>(null);

  // Compact on scroll; tuck away when scrolling down quickly, return on scroll up.
  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 8);
    if (menu || mobileOpen) return;
    setHidden(y > 480 && y > prev + 4);
    if (y < prev - 4) setHidden(false);
  });

  const close = useCallback(() => setMenu(null), []);

  // Close menus on navigation ("adjust state when a prop changes" pattern, no effect needed).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenu(null);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        // Return focus to the account trigger if focus was inside its panel.
        if (document.getElementById("account-panel")?.contains(document.activeElement)) accountBtn.current?.focus();
        close();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    }
    function onClick(e: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) close();
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [close]);

  const openHover = (id: MenuId) => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setMenu(id);
  };
  const leaveHover = () => {
    closeTimer.current = window.setTimeout(() => setMenu(null), 140);
  };

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const marketActive = pathname.startsWith("/auctions");
  const resourcesActive = RESOURCES.some((r) => pathname.startsWith(r.href));

  return (
    <>
      <motion.header
        ref={headerRef}
        animate={{ y: hidden && !reduce ? "-110%" : "0%" }}
        transition={springs.snappy}
        className="sticky top-0 z-50"
      >
        <div
          className={cn(
            "border-b transition-[background-color,border-color,box-shadow] duration-300",
            scrolled || menu ? "border-line/70 bg-surface/92 shadow-sm backdrop-blur-xl backdrop-saturate-150" : "border-transparent bg-transparent",
          )}
        >
          <div className="container-page flex h-[72px] items-center gap-6">
            <Logo />

            <nav aria-label="Main" className="ml-4 hidden items-center gap-1 lg:flex">
              <NavTrigger
                label="Marketplace"
                open={menu === "market"}
                active={marketActive}
                onToggle={() => setMenu(menu === "market" ? null : "market")}
                onHover={() => openHover("market")}
                onLeave={leaveHover}
              />
              <NavTrigger
                label="Resources"
                open={menu === "resources"}
                active={resourcesActive}
                onToggle={() => setMenu(menu === "resources" ? null : "resources")}
                onHover={() => openHover("resources")}
                onLeave={leaveHover}
              />
              {LINKS.map((l) => (
                <NavLink key={l.href} href={l.href} active={isActive(l.href)}>
                  {l.label}
                </NavLink>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="hidden h-10 items-center gap-2 rounded-full border border-line bg-surface/70 pl-3.5 pr-2 text-sm text-muted transition-colors hover:border-line-strong hover:text-ink md:inline-flex"
                aria-label="Search auctions"
              >
                <Search className="size-4" aria-hidden />
                <span className="pr-6">Search auctions</span>
                <span className="rounded-md border border-line px-1.5 font-mono text-[0.68rem]">⌘K</span>
              </button>
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="grid size-10 place-items-center rounded-full text-ink-2 hover:bg-paper-2 md:hidden"
                aria-label="Search auctions"
              >
                <Search className="size-[18px]" />
              </button>
              <ThemeToggle />

              {status === "loading" ? (
                <span className="ml-1 hidden h-10 w-24 rounded-full skeleton sm:block" aria-hidden />
              ) : user ? (
                <div className="relative hidden sm:block">
                  <button
                    ref={accountBtn}
                    type="button"
                    aria-expanded={menu === "account"}
                    aria-controls="account-panel"
                    onClick={() => setMenu(menu === "account" ? null : "account")}
                    className="ml-1 flex h-10 items-center gap-2 rounded-full border border-line bg-surface pl-1 pr-3 text-sm font-medium text-ink hover:border-line-strong"
                  >
                    <span className="grid size-8 place-items-center rounded-full bg-ink text-[0.8rem] font-semibold text-paper">
                      {user.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="max-w-[9rem] truncate">{user.name.split(" ")[0]}</span>
                    <ChevronDown className={cn("size-4 text-muted transition-transform", menu === "account" && "rotate-180")} />
                  </button>
                  <AnimatePresence>
                    {menu === "account" && (
                      <motion.div
                        id="account-panel"
                        variants={dropdown}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute right-0 top-[calc(100%+10px)] w-64 origin-top-right rounded-2xl border border-line bg-surface p-2 shadow-lg"
                      >
                        <div className="px-3 py-2.5">
                          <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                          <p className="truncate text-xs text-muted">{user.email}</p>
                          <p className="mt-2 inline-flex rounded-full bg-brand-soft px-2 py-0.5 text-[0.7rem] font-medium capitalize text-brand-ink">
                            {user.plan} plan
                          </p>
                        </div>
                        <div className="my-1 h-px bg-line" />
                        <MenuLink href="/dashboard" icon={<LayoutDashboard className="size-4" />}>
                          Dashboard
                        </MenuLink>
                        <MenuLink href="/dashboard/profile" icon={<Settings className="size-4" />}>
                          Profile & alerts
                        </MenuLink>
                        {user.role !== "buyer" && (
                          <MenuLink href={`/${user.role === "admin" ? "admin" : user.role}`} icon={<UserRound className="size-4" />}>
                            {user.role === "admin" ? "Admin console" : user.role === "seller" ? "Seller portal" : "Logistics portal"}
                          </MenuLink>
                        )}
                        <button
                          type="button"
                          onClick={() => void signOut()}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-danger hover:bg-danger-soft"
                        >
                          <LogOut className="size-4" /> Sign out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden items-center gap-1 sm:flex">
                  <Link href="/auth/login" className="rounded-full px-3.5 py-2 text-sm font-medium text-ink-2 hover:bg-paper-2 hover:text-ink">
                    Sign in
                  </Link>
                  <ButtonLink href="/auth/register" size="sm" className="rounded-full">
                    Get started
                  </ButtonLink>
                </div>
              )}

              <button
                type="button"
                className="grid size-10 place-items-center rounded-full text-ink hover:bg-paper-2 lg:hidden"
                aria-label="Open menu"
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="size-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mega menus */}
        <AnimatePresence>
          {(menu === "market" || menu === "resources") && (
            <motion.div
              key={menu}
              variants={dropdown}
              initial="hidden"
              animate="visible"
              exit="exit"
              onMouseEnter={() => openHover(menu)}
              onMouseLeave={leaveHover}
              className="absolute inset-x-0 top-full hidden lg:block"
            >
              <div className="container-page pt-2">
                <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-lg">
                  {menu === "market" ? <MarketMenu onNavigate={close} /> : <ResourcesMenu onNavigate={close} />}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} onSearch={() => setPaletteOpen(true)} />
      <SearchPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}

function NavTrigger({
  label,
  open,
  active,
  onToggle,
  onHover,
  onLeave,
}: {
  label: string;
  open: boolean;
  active: boolean;
  onToggle: () => void;
  onHover: () => void;
  onLeave: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-haspopup="true"
      onClick={onToggle}
      // Hover-open for mouse only: on touch, mouseenter + click would open then immediately close.
      onPointerEnter={(e) => e.pointerType === "mouse" && onHover()}
      onPointerLeave={(e) => e.pointerType === "mouse" && onLeave()}
      className={cn(
        "relative inline-flex h-10 items-center gap-1 rounded-full px-3.5 text-[0.93rem] font-medium transition-colors",
        open || active ? "text-ink" : "text-ink-2 hover:text-ink",
      )}
    >
      {active && <ActivePill />}
      <span className="relative">{label}</span>
      <ChevronDown className={cn("relative size-4 text-muted transition-transform duration-200", open && "rotate-180")} aria-hidden />
    </button>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative inline-flex h-10 items-center rounded-full px-3.5 text-[0.93rem] font-medium transition-colors",
        active ? "text-ink" : "text-ink-2 hover:text-ink",
      )}
    >
      {active && <ActivePill />}
      <span className="relative">{children}</span>
    </Link>
  );
}

function ActivePill() {
  const reduce = useSafeReducedMotion();
  return (
    <motion.span
      layoutId="nav-active"
      transition={reduce ? { duration: 0 } : springs.layout}
      className="absolute inset-0 rounded-full bg-paper-2 ring-1 ring-line"
      aria-hidden
    />
  );
}

function MenuLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-2 hover:bg-paper-2 hover:text-ink">
      <span className="text-muted">{icon}</span>
      {children}
    </Link>
  );
}

function MarketMenu({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="grid grid-cols-[1.6fr_1fr]">
      <div className="p-6">
        <p className="eyebrow mb-4">Browse by category</p>
        <ul className="grid grid-cols-2 gap-1">
          {CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICONS[c.id];
            return (
              <li key={c.id}>
                <Link
                  href={`/auctions?category=${c.id}`}
                  onClick={onNavigate}
                  className="group flex items-start gap-3 rounded-2xl p-3 transition-colors hover:bg-paper"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-surface-2 text-ink-2 transition-colors group-hover:border-brand group-hover:bg-brand group-hover:text-on-brand">
                    <Icon className="size-[18px]" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-ink">{c.label}</span>
                    <span className="mt-0.5 line-clamp-1 block text-[0.8rem] text-muted">{c.subCategories.slice(0, 3).join(" · ")}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="flex flex-col justify-between border-l border-line bg-paper p-6">
        <div>
          <p className="eyebrow mb-4">Popular searches</p>
          <ul className="space-y-1">
            {QUICK_SEARCHES.map((s) => (
              <li key={s.q}>
                <Link
                  href={`/auctions?q=${encodeURIComponent(s.q)}`}
                  onClick={onNavigate}
                  className="group flex items-center justify-between rounded-xl px-3 py-2 text-sm text-ink-2 hover:bg-surface hover:text-ink"
                >
                  {s.label}
                  <ArrowRight className="size-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <Link
          href="/auctions"
          onClick={onNavigate}
          className="mt-6 flex items-center justify-between rounded-2xl bg-ink px-5 py-4 text-paper transition-transform hover:-translate-y-0.5"
        >
          <span>
            <span className="block text-sm font-semibold">Open the marketplace</span>
            <span className="block text-xs opacity-70">MSTC + bank auctions in one search</span>
          </span>
          <ArrowRight className="size-5" />
        </Link>
      </div>
    </div>
  );
}

function ResourcesMenu({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="grid grid-cols-4 gap-1 p-4">
      {RESOURCES.map((r) => (
        <Link key={r.href} href={r.href} onClick={onNavigate} className="group rounded-2xl p-4 transition-colors hover:bg-paper">
          <r.icon className="size-5 text-brand" aria-hidden />
          <span className="mt-3 block text-sm font-semibold text-ink">{r.label}</span>
          <span className="mt-1 block text-[0.8rem] leading-snug text-muted">{r.description}</span>
        </Link>
      ))}
    </div>
  );
}
