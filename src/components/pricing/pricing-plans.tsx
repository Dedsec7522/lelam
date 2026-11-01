"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Minus, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { COMPARISON, PLANS, YEARLY_DISCOUNT, monthlyEquivalent, priceFor, type Plan } from "@/lib/plans";
import { formatINR } from "@/lib/format";
import { springs } from "@/lib/motion";
import type { BillingCycle } from "@/lib/types";
import { ButtonLink } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { useSession } from "@/components/session";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

export function PricingPlans() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const { user } = useSession();

  return (
    <>
      <div className="flex justify-center">
        <Segmented<BillingCycle>
          variant="radio"
          label="Billing cycle"
          value={cycle}
          onChange={setCycle}
          options={[
            { value: "monthly", label: "Monthly" },
            {
              value: "yearly",
              label: (
                <>
                  Yearly
                  <span className="rounded-full bg-copper px-1.5 py-0.5 text-[0.65rem] font-semibold text-on-copper">−{Math.round(YEARLY_DISCOUNT * 100)}%</span>
                </>
              ),
            },
          ]}
        />
      </div>

      <Stagger className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((plan) => (
          <StaggerItem key={plan.id} className="h-full">
            <PlanCard plan={plan} cycle={cycle} current={user?.plan === plan.id} signedIn={!!user} />
          </StaggerItem>
        ))}
      </Stagger>
    </>
  );
}

function PlanCard({ plan, cycle, current, signedIn }: { plan: Plan; cycle: BillingCycle; current: boolean; signedIn: boolean }) {
  const reduce = useSafeReducedMotion();
  const monthly = monthlyEquivalent(plan, cycle);
  const yearlyTotal = priceFor(plan, "yearly");
  const dark = plan.highlight;

  const href =
    plan.id === "enterprise"
      ? "/contact?topic=sales"
      : plan.id === "free"
        ? signedIn
          ? "/dashboard"
          : "/auth/register"
        : `/checkout?plan=${plan.id}&cycle=${cycle}${plan.trialDays ? "&trial=1" : ""}`;

  return (
    <div
      className={cn(
        "relative flex h-full flex-col rounded-3xl border p-7 transition-[box-shadow,transform] duration-300 hover:-translate-y-1",
        dark ? "border-ink bg-ink text-paper shadow-lg" : "border-line bg-surface hover:shadow-md",
      )}
      style={dark ? { colorScheme: "dark" } : undefined}
    >
      {dark && (
        <span className="absolute -top-3 left-7 inline-flex items-center gap-1 rounded-full bg-copper px-3 py-1 text-[0.72rem] font-semibold text-on-copper">
          <Sparkles className="size-3.5" aria-hidden /> Most popular
        </span>
      )}
      <h3 className={cn("text-lg font-semibold", dark ? "text-paper" : "text-ink")}>{plan.name}</h3>
      <p className={cn("mt-1.5 min-h-10 text-sm leading-snug", dark ? "text-paper/70" : "text-muted")}>{plan.tagline}</p>

      <div className="mt-6 flex h-14 items-end gap-1.5" aria-live="polite">
        {monthly === null ? (
          <span className="text-[2.4rem] font-semibold leading-none tracking-tight">Custom</span>
        ) : (
          <>
            <span className="relative overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={`${plan.id}-${cycle}`}
                  initial={{ y: reduce ? 0 : "100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: reduce ? 0 : "-100%", opacity: 0 }}
                  transition={springs.snappy}
                  className="block font-mono text-[2.4rem] font-semibold leading-none tracking-tight tabular-nums"
                >
                  {monthly === 0 ? "₹0" : formatINR(monthly)}
                </motion.span>
              </AnimatePresence>
            </span>
            <span className={cn("pb-1 text-sm", dark ? "text-paper/60" : "text-muted")}>/month</span>
          </>
        )}
      </div>
      <p className={cn("mt-1 h-5 text-[0.78rem]", dark ? "text-paper/60" : "text-muted")}>
        {cycle === "yearly" && yearlyTotal ? `${formatINR(yearlyTotal)} billed yearly + GST` : monthly ? "Billed monthly + GST" : " "}
      </p>

      <div className="mt-6">
        {current ? (
          <span className={cn("inline-flex h-11 w-full items-center justify-center rounded-xl border text-sm font-medium", dark ? "border-paper/20 text-paper/80" : "border-line text-muted")}>
            Your current plan
          </span>
        ) : (
          <ButtonLink href={href} variant={dark ? "copper" : plan.id === "enterprise" ? "ink" : "secondary"} className="w-full">
            {plan.cta}
          </ButtonLink>
        )}
      </div>

      <p className={cn("mt-7 text-[0.78rem] font-semibold uppercase tracking-wider", dark ? "text-paper/60" : "text-faint")}>{plan.includesLabel}</p>
      <ul className="mt-3 space-y-2.5">
        {plan.features.map((f) => (
          <li key={f} className={cn("flex gap-2.5 text-[0.9rem] leading-snug", dark ? "text-paper/85" : "text-ink-2")}>
            <Check className={cn("mt-0.5 size-4 shrink-0", dark ? "text-copper" : "text-brand")} aria-hidden />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ComparisonTable() {
  const heads = PLANS.map((p) => ({ name: p.name, price: p.monthly === null ? "Custom" : p.monthly === 0 ? "₹0" : `${formatINR(p.monthly)}/mo` }));
  return (
    <div className="overflow-x-auto rounded-3xl border border-line bg-surface">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <caption className="sr-only">Feature comparison across Free, Individual, Business and Enterprise plans</caption>
        <thead className="bg-surface">
          <tr className="border-b border-line">
            <th scope="col" className="w-[38%] px-6 py-5 text-[0.8rem] font-medium text-muted">
              Features
            </th>
            {heads.map((h, i) => (
              <th key={h.name} scope="col" className={cn("px-4 py-5 text-center", i === 2 && "bg-brand-soft/60")}>
                <span className="block font-semibold text-ink">{h.name}</span>
                <span className="mt-0.5 block font-mono text-[0.75rem] font-normal text-muted">{h.price}</span>
              </th>
            ))}
          </tr>
        </thead>
        {COMPARISON.map((g) => (
          <tbody key={g.title}>
            <tr>
              <th scope="colgroup" colSpan={5} className="bg-paper-2 px-6 py-2.5 text-[0.72rem] font-semibold uppercase tracking-wider text-muted">
                {g.title}
              </th>
            </tr>
            {g.rows.map((r) => (
              <tr key={r.label} className="border-b border-line transition-colors last:border-b-0 hover:bg-surface-2">
                <th scope="row" className="px-6 py-3.5 font-normal text-ink-2">
                  {r.label}
                </th>
                {r.values.map((v, i) => (
                  <td key={i} className={cn("px-4 py-3.5 text-center", i === 2 && "bg-brand-soft/40")}>
                    {v === true ? (
                      <Check className="mx-auto size-[18px] text-brand" aria-label="Included" />
                    ) : v === false ? (
                      <Minus className="mx-auto size-4 text-faint" aria-label="Not included" />
                    ) : (
                      <span className="text-[0.82rem] font-medium text-ink">{v}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}
