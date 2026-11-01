import type { ReactNode } from "react";
import { Suspense } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { PLAN_BY_ID } from "@/lib/plans";
import type { PlanId, Role } from "@/lib/types";
import { WorkspaceNav, type NavItem } from "./workspace-nav";
import { DeniedNotice } from "./denied-notice";

const ROLE_LABEL: Record<Role, string> = { buyer: "Buyer", seller: "Seller", logistics: "Logistics partner", admin: "Admin" };

/** Responsive two-column shell for every signed-in area. */
export function WorkspaceShell({
  section,
  user,
  items,
  secondary,
  children,
}: {
  section: string;
  user: { name: string; plan: PlanId; role: Role; email: string };
  items: NavItem[];
  secondary?: NavItem[];
  children: ReactNode;
}) {
  const plan = PLAN_BY_ID[user.plan];
  return (
    <div className="container-page py-6 lg:py-10">
      <div className="grid gap-6 lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-10">
        <aside className="min-w-0 lg:sticky lg:top-[96px] lg:self-start">
          <div className="mb-4 flex items-center justify-between gap-3 lg:mb-6 lg:flex-col lg:items-start">
            <div className="min-w-0">
              <p className="eyebrow text-[0.66rem]">{section}</p>
              <p className="mt-1 truncate text-base font-semibold text-ink">{user.name}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-1.5">
              <Badge tone={user.plan === "free" ? "neutral" : "brand"}>{plan.name} plan</Badge>
              {user.role !== "buyer" && <Badge tone="copper">{ROLE_LABEL[user.role]}</Badge>}
            </div>
          </div>
          <WorkspaceNav items={items} secondary={secondary} label={`${section} navigation`} />
          {user.plan === "free" && (
            <Link
              href="/pricing"
              className="mt-6 hidden rounded-2xl border border-line bg-surface-2 p-4 transition-colors hover:border-brand/40 lg:block"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Sparkles className="size-4 text-copper" aria-hidden /> Upgrade
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-muted">
                Unlock reminders, the document vault, inventory and logistics quotes from ₹799/month.
              </span>
            </Link>
          )}
        </aside>
        <div className="min-w-0">
          <Suspense fallback={null}>
            <DeniedNotice />
          </Suspense>
          {children}
        </div>
      </div>
    </div>
  );
}
