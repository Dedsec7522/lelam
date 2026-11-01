"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BadgeCheck, CheckCircle2, CreditCard, Info, Lock, Tag } from "lucide-react";
import { cn } from "@/lib/cn";
import { quoteFor, stateFromPincode, SUBSCRIPTION_GST } from "@/lib/billing";
import { PLAN_BY_ID } from "@/lib/plans";
import { formatINR } from "@/lib/format";
import { motionTokens, springs } from "@/lib/motion";
import type { BillingCycle, PlanId } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Checkbox, Input } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { useSession } from "@/components/session";
import { useJsonForm } from "@/components/forms/use-form";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

type PaidPlan = "individual" | "business";

export function CheckoutForm(props: {
  initialPlan: PaidPlan;
  initialCycle: BillingCycle;
  wantsTrial: boolean;
  trialUsed: boolean;
  name: string;
  email: string;
  currentPlan: PlanId;
  mode: "demo" | "live" | "disabled";
}) {
  const router = useRouter();
  const reduce = useSafeReducedMotion();
  const { refresh } = useSession();
  // Never start on the plan the user already has (its option is disabled).
  const [plan, setPlan] = useState<PaidPlan>(
    props.currentPlan === props.initialPlan ? (props.initialPlan === "business" ? "individual" : "business") : props.initialPlan,
  );
  const [cycle, setCycle] = useState<BillingCycle>(props.initialCycle);
  const [trial, setTrial] = useState(props.wantsTrial);
  const [billing, setBilling] = useState({ billingName: props.name, gstin: "", pincode: "", city: "", state: "" });
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; percent: number } | null>(null);
  const [couponState, setCouponState] = useState<{ status: "idle" | "checking" | "error"; message?: string }>({ status: "idle" });
  const [done, setDone] = useState<{ reference: string; renewsAt: string; amount: number } | null>(null);
  const form = useJsonForm<Record<string, unknown>, { reference: string; renewsAt: string; amount: number }>("/api/checkout");

  const trialEligible = plan === "business" && !props.trialUsed;
  const useTrial = trial && trialEligible;
  const quote = useMemo(() => quoteFor(plan, cycle, coupon?.code), [plan, cycle, coupon]);
  const dueToday = useTrial ? 0 : quote.total;

  async function applyCoupon() {
    if (!couponInput.trim()) return;
    setCouponState({ status: "checking" });
    try {
      const res = await fetch(`/api/checkout?coupon=${encodeURIComponent(couponInput.trim())}`);
      const data = (await res.json()) as { code?: string; percent?: number; error?: string };
      if (!res.ok || !data.code) throw new Error(data.error ?? "That coupon code isn't valid.");
      setCoupon({ code: data.code, percent: data.percent ?? 0 });
      setCouponState({ status: "idle" });
    } catch (err) {
      setCoupon(null);
      setCouponState({ status: "error", message: (err as Error).message });
    }
  }

  function onPincode(value: string) {
    const pin = value.replace(/\D/g, "").slice(0, 6);
    const state = stateFromPincode(pin);
    setBilling((b) => ({ ...b, pincode: pin, state: state ?? b.state }));
    form.clearField("pincode");
  }

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    const result = await form.submit({ plan, cycle, trial: useTrial, coupon: coupon?.code ?? "", ...billing });
    if (result) {
      setDone(result);
      await refresh();
      router.refresh();
    }
  }

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={springs.gentle} className="relative mx-auto max-w-xl overflow-hidden rounded-3xl border border-line bg-surface p-10 text-center shadow-md" role="status">
        <Burst disabled={!!reduce} />
        <CheckCircle2 className="relative mx-auto size-14 text-positive" aria-hidden />
        <h2 className="relative mt-5 text-2xl font-semibold text-ink">{useTrial ? "Your Business trial is live" : `Welcome to ${PLAN_BY_ID[plan].name}`}</h2>
        <p className="relative mt-2 text-muted">
          {useTrial ? "Enjoy 30 days of every Business feature." : `Paid ${formatINR(done.amount)}.`} Renews on {new Date(done.renewsAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}.
        </p>
        <p className="relative mt-1 font-mono text-[0.8rem] text-faint">Reference {done.reference}</p>
        <div className="relative mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={() => router.push("/dashboard")}>Go to dashboard</Button>
          <Button variant="secondary" onClick={() => router.push("/auctions")}>
            Browse auctions
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <form noValidate onSubmit={pay} className="grid gap-8 lg:grid-cols-[1.25fr_1fr]">
      <div className="space-y-8">
        {props.mode === "demo" && (
          <p className="flex gap-3 rounded-2xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-ink-2">
            <Info className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
            <span>
              <strong className="font-semibold">Demo payments are on.</strong> No card is charged. Your plan activates with a DEMO reference so you can try paid features. Connect a payment gateway before launch.
            </span>
          </p>
        )}
        {props.mode === "disabled" && (
          <p className="flex gap-3 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-ink-2">
            <Info className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
            Online payments aren&apos;t available yet. You can start the Business trial, or{" "}
            <Link href="/contact?topic=sales" className="font-medium text-brand underline">
              contact sales
            </Link>
            .
          </p>
        )}

        <section aria-labelledby="plan-h" className="rounded-3xl border border-line bg-surface p-6">
          <h2 id="plan-h" className="font-semibold text-ink">
            1. Choose your plan
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Plan">
            {(["individual", "business"] as const).map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={plan === p}
                disabled={props.currentPlan === p}
                onClick={() => setPlan(p)}
                className={cn(
                  "relative rounded-2xl border p-4 text-left transition-colors disabled:opacity-50",
                  plan === p ? "border-brand bg-brand-soft/50 ring-2 ring-brand/20" : "border-line hover:border-line-strong",
                )}
              >
                <span className="flex items-center justify-between">
                  <span className="font-semibold text-ink">{PLAN_BY_ID[p].name}</span>
                  {plan === p && <BadgeCheck className="size-5 text-brand" aria-hidden />}
                </span>
                <span className="mt-1 block font-mono text-sm text-ink-2">{formatINR(PLAN_BY_ID[p].monthly ?? 0)}/mo</span>
                <span className="mt-1 block text-[0.8rem] text-muted">{props.currentPlan === p ? "Your current plan" : PLAN_BY_ID[p].tagline}</span>
              </button>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Segmented<BillingCycle> variant="radio" size="sm" label="Billing cycle" value={cycle} onChange={setCycle} options={[{ value: "monthly", label: "Monthly" }, { value: "yearly", label: "Yearly · save 12%" }]} />
            {trialEligible && <Checkbox label="Start with the 30-day free trial" checked={trial} onChange={(e) => setTrial(e.target.checked)} />}
          </div>
        </section>

        <section aria-labelledby="bill-h" className="rounded-3xl border border-line bg-surface p-6">
          <h2 id="bill-h" className="font-semibold text-ink">
            2. Billing details
          </h2>
          <p className="mt-1 text-sm text-muted">Invoices go to {props.email}.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Input label="Name or business name" required className="sm:col-span-2" value={billing.billingName} onChange={(e) => setBilling((b) => ({ ...b, billingName: e.target.value }))} error={form.fields.billingName} autoComplete="organization" />
            <Input
              label="GSTIN (optional)"
              value={billing.gstin}
              onChange={(e) => {
                setBilling((b) => ({ ...b, gstin: e.target.value.toUpperCase().slice(0, 15) }));
                form.clearField("gstin");
              }}
              error={form.fields.gstin}
              hint="Add it to receive a GST invoice and claim ITC."
              className="sm:col-span-2"
              spellCheck={false}
            />
            <Input label="PIN code" required inputMode="numeric" autoComplete="postal-code" value={billing.pincode} onChange={(e) => onPincode(e.target.value)} error={form.fields.pincode} />
            <Input label="City" required autoComplete="address-level2" value={billing.city} onChange={(e) => setBilling((b) => ({ ...b, city: e.target.value }))} error={form.fields.city} />
            <Input
              label="State"
              required
              autoComplete="address-level1"
              value={billing.state}
              onChange={(e) => setBilling((b) => ({ ...b, state: e.target.value }))}
              error={form.fields.state}
              hint={billing.pincode.length === 6 && !stateFromPincode(billing.pincode) ? "We couldn't match that PIN. Enter your state." : undefined}
              className="sm:col-span-2"
            />
          </div>
        </section>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-3xl border border-line bg-surface p-6 shadow-sm">
          <h2 className="font-semibold text-ink">Order summary</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <Row label={`${PLAN_BY_ID[plan].name} · ${cycle === "yearly" ? "12 months" : "1 month"}`} value={formatINR(quote.base)} />
            <AnimatePresence initial={false}>
              {quote.discount > 0 && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Row label={`Coupon ${quote.coupon} (−${quote.discountPercent}%)`} value={`−${formatINR(quote.discount)}`} tone="positive" />
                </motion.div>
              )}
            </AnimatePresence>
            <Row label={`GST ${SUBSCRIPTION_GST}%`} value={formatINR(quote.gst)} />
            <div className="border-t border-line pt-3">
              <Row label={useTrial ? "Due after trial" : "Total"} value={formatINR(quote.total)} strong />
            </div>
            {useTrial && <Row label="Due today" value={formatINR(0)} strong tone="positive" />}
          </dl>

          <div className="mt-6">
            <label htmlFor="coupon" className="text-sm font-medium text-ink-2">
              Coupon code
            </label>
            <div className="mt-1.5 flex gap-2">
              <div className="relative flex-1">
                <Tag className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
                <input
                  id="coupon"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void applyCoupon();
                    }
                  }}
                  aria-invalid={couponState.status === "error" || !!form.fields.coupon || undefined}
                  aria-describedby="coupon-msg"
                  className="h-11 w-full rounded-xl border border-line-strong bg-surface pl-9 pr-3 font-mono text-sm uppercase text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/12"
                />
              </div>
              <Button variant="secondary" onClick={() => void applyCoupon()} loading={couponState.status === "checking"}>
                Apply
              </Button>
            </div>
            <p id="coupon-msg" className="mt-1.5 min-h-5 text-[0.8rem]" aria-live="polite">
              {coupon ? (
                <span className="text-positive">
                  {coupon.code} applied: {coupon.percent}% off
                </span>
              ) : couponState.status === "error" ? (
                <span className="text-danger">{couponState.message}</span>
              ) : (
                <span className="text-faint">Try LAUNCH10</span>
              )}
            </p>
          </div>

          {form.message && (
            <p role="alert" className="mt-4 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
              {form.message}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            className="mt-6 w-full"
            loading={form.status === "submitting"}
            disabled={(props.mode === "disabled" && !useTrial) || plan === props.currentPlan}
          >
            {useTrial ? (
              "Start free trial"
            ) : (
              <>
                <CreditCard className="size-4" aria-hidden /> Pay {formatINR(dueToday)}
              </>
            )}
          </Button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[0.75rem] text-muted">
            <Lock className="size-3.5" aria-hidden /> Card, UPI and net banking via our payment partner
          </p>
        </div>
      </aside>
    </form>
  );
}

function Row({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: "positive" }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className={cn(strong ? "font-semibold text-ink" : "text-muted")}>{label}</dt>
      <dd className={cn("font-mono tabular-nums", strong ? "text-lg font-semibold text-ink" : "text-ink-2", tone === "positive" && "text-positive")}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={value} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: motionTokens.duration.fast }} className="inline-block">
            {value}
          </motion.span>
        </AnimatePresence>
      </dd>
    </div>
  );
}

/** Lightweight celebratory burst (no confetti dependency). */
function Burst({ disabled }: { disabled: boolean }) {
  if (disabled) return null;
  const pieces = Array.from({ length: 18 }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute left-1/2 top-16" aria-hidden>
      {pieces.map((i) => {
        const angle = (i / pieces.length) * Math.PI * 2;
        const dist = 90 + (i % 4) * 22;
        return (
          <motion.span
            key={i}
            className={cn("absolute size-2 rounded-sm", i % 3 === 0 ? "bg-copper" : i % 3 === 1 ? "bg-brand" : "bg-ink")}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
            animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: 0, rotate: 200, scale: 0.6 }}
            transition={{ duration: motionTokens.duration.crawl, ease: motionTokens.easing.smooth }}
          />
        );
      })}
    </div>
  );
}
