import { ArrowRight, Check, Lock } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/primitives";
import { Reveal } from "@/components/motion/reveal";
import { requiredPlan, type Feature } from "@/lib/plans";
import { formatINR } from "@/lib/format";

const COPY: Partial<Record<Feature, { title: string; pitch: string; benefits: string[] }>> = {
  documents: {
    title: "Document vault",
    pitch: "Keep GST, PAN, EMD receipts and sale letters in one place, with expiry warnings before they lapse.",
    benefits: ["Upload PDF, PNG or JPG up to 5 MB", "Expiry reminders 30 days ahead", "Private, auth-checked downloads", "Ready for every MSTC registration"],
  },
  reminders: {
    title: "Custom reminders",
    pitch: "Never miss an inspection window, EMD deadline or closing bell again.",
    benefits: ["Email, SMS or WhatsApp channel", "Link reminders to auctions", "Mark done and keep a history", "Works with your watchlist"],
  },
  inventory: {
    title: "Inventory & vendors",
    pitch: "Track what you won, where it sits and what it cost, alongside the transporters and recyclers you trust.",
    benefits: ["Stock value by material", "Source auction on every lot", "Vendor directory with ratings", "One-tap call and email"],
  },
  logisticsQuotes: {
    title: "Logistics quotes",
    pitch: "Post a pickup and get competing transport quotes from verified logistics partners.",
    benefits: ["Prefilled from the auction location", "Compare price and ETA", "Accept a quote in one tap", "Partners notified instantly"],
  },
  quoteBuilder: {
    title: "Quote Builder",
    pitch: "Turn an auction lot into a professional resale quote with GST and your margin worked out.",
    benefits: ["Prefill line items from auction lots", "GST and margin calculated live", "Print-ready PDF export", "Draft and sent tracking"],
  },
};

/** Shown in place of a gated tool. The API enforces the same rule (403). */
export function UpgradePanel({ feature }: { feature: Feature }) {
  const plan = requiredPlan(feature);
  const copy = COPY[feature] ?? { title: "This tool", pitch: "Upgrade to unlock it.", benefits: [] };
  return (
    <Reveal>
      <Card className="relative overflow-hidden p-6 sm:p-10">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-brand-soft blur-2xl" />
        <div className="relative grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <Badge tone="copper">
              <Lock className="size-3" aria-hidden /> {plan.name} plan
            </Badge>
            <h2 className="mt-4 text-2xl font-semibold leading-tight text-ink sm:text-[1.75rem]">{copy.title} is a {plan.name} feature</h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted sm:text-base">{copy.pitch}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <ButtonLink href={`/pricing?plan=${plan.id}`} iconRight={<ArrowRight className="size-4" />}>
                Upgrade to {plan.name}
              </ButtonLink>
              {plan.monthly !== null && <span className="text-sm text-muted">from {formatINR(plan.monthly)}/month</span>}
            </div>
          </div>
          <ul className="grid gap-3 rounded-2xl border border-line bg-surface-2 p-5">
            {copy.benefits.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm text-ink-2">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-positive-soft text-positive">
                  <Check className="size-3.5" aria-hidden />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </Reveal>
  );
}
