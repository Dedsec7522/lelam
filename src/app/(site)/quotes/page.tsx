import type { Metadata } from "next";
import { ArrowRight, Building2, FileDown, Gavel, Percent, Send, Sparkles, Truck } from "lucide-react";
import { PLAN_BY_ID, requiredPlan } from "@/lib/plans";
import { formatINR } from "@/lib/format";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Accent, Badge, SectionHeading } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Quote Builder: turn an auction lot into a commercial quote",
  description:
    "Build an itemised quote from any lot with landed cost, margin, GST and your branding, then export a PDF or send it to logistics partners. Included in Business.",
  alternates: { canonical: "/quotes" },
};

/** Illustrative figures only, rendered as markup so the preview stays crisp and accessible. */
const LINES = [
  { item: "HMS 1&2 steel scrap, 20 MT (winning bid)", amount: 500000 },
  { item: "Loading at yard", amount: 7000 },
  { item: "Transport, 180 km", amount: 19800 },
  { item: "Sorting & handling", amount: 12000 },
];
const MARGIN = 0.12;
const GST = 0.18;

const FEATURES = [
  { icon: Gavel, title: "Starts from the lot", text: "Pick any auction and the quote pre-fills quantity, unit, location and the estimated landed cost." },
  { icon: Percent, title: "Margin you can see", text: "Set a margin as a percentage or an amount and watch the selling price and GST update line by line." },
  { icon: Building2, title: "Your letterhead", text: "Add your logo, GSTIN, address and terms once. Every quote goes out under your brand, not ours." },
  { icon: FileDown, title: "PDF in one click", text: "Export a clean, print-ready quote to send to a buyer, attach to an email or file with your records." },
  { icon: Truck, title: "Loop in logistics", text: "Share the quote with transport partners to confirm freight before you commit to a bid." },
  { icon: Sparkles, title: "Kept with the lot", text: "Quotes stay linked to the auction, so revisions and outcomes are easy to track later." },
];

const STEPS = [
  { title: "Choose a lot", text: "Open an auction you are watching and select Create quote." },
  { title: "Set costs and margin", text: "Adjust transport, handling and your margin. Lelam keeps the tax maths right." },
  { title: "Brand and export", text: "Apply your letterhead, then download the PDF or send it on." },
];

export default function QuotesPage() {
  const plan = requiredPlan("quoteBuilder");
  const business = PLAN_BY_ID.business;
  const subtotal = LINES.reduce((s, l) => s + l.amount, 0);
  const margin = Math.round(subtotal * MARGIN);
  const taxable = subtotal + margin;
  const gst = Math.round(taxable * GST);
  const total = taxable + gst;

  return (
    <>
      <section className="relative overflow-hidden pb-20 pt-14 sm:pt-20">
        <div className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top_right,black_25%,transparent_70%)]" aria-hidden />
        <div className="container-page grid gap-14 lg:grid-cols-[1fr_1.05fr] lg:items-center">
          <Reveal>
            <Badge tone="copper">{plan.name} plan feature</Badge>
            <h1 className="mt-5 text-[2.3rem] font-semibold leading-[1.06] text-ink sm:text-[3.2rem]">
              From winning bid to <Accent>signed quote</Accent> in minutes
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              The Quote Builder turns an auction lot into an itemised commercial quote with landed cost, your margin, GST and your branding. Export a PDF or share it
              with logistics partners without retyping a number.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/dashboard/quotes" size="lg" iconRight={<ArrowRight className="size-4" />}>
                Open Quote Builder
              </ButtonLink>
              <ButtonLink href="/pricing" variant="secondary" size="lg">
                See {plan.name} pricing
              </ButtonLink>
            </div>
            <p className="mt-4 text-sm text-muted">
              Included in {business.name} at {formatINR(business.monthly ?? 0)}/month + GST
              {business.trialDays ? `, with a ${business.trialDays}-day trial` : ""}.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <figure className="relative">
              <div aria-hidden className="absolute -inset-4 -z-10 rotate-2 rounded-[32px] border border-line bg-paper-2" />
              <div className="rounded-3xl border border-line bg-surface p-5 shadow-lg sm:p-7">
                <div className="flex items-start justify-between gap-4 border-b border-line pb-5">
                  <div>
                    <p className="eyebrow">Quotation</p>
                    <p className="mt-1 text-lg font-semibold text-ink">Your Company Pvt Ltd</p>
                    <p className="text-xs text-muted">GSTIN 32XXXXX0000X1ZX · Kochi (sample)</p>
                  </div>
                  <div className="text-right text-xs text-muted">
                    <p className="font-mono text-ink-2">Q-2026-0142</p>
                    <p className="mt-1">Valid 15 days</p>
                  </div>
                </div>
                <div className="-mx-1 overflow-x-auto px-1">
                  <table className="mt-4 w-full min-w-[300px] text-sm">
                    <caption className="sr-only">Illustrative quote line items</caption>
                    <thead>
                      <tr className="text-left text-xs text-muted">
                        <th scope="col" className="pb-2 font-medium">
                          Item
                        </th>
                        <th scope="col" className="pb-2 text-right font-medium">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-ink-2">
                      {LINES.map((l) => (
                        <tr key={l.item} className="border-t border-line">
                          <td className="py-2.5 pr-4">{l.item}</td>
                          <td className="py-2.5 text-right font-mono tabular-nums">{formatINR(l.amount)}</td>
                        </tr>
                      ))}
                      <tr className="border-t border-line">
                        <td className="py-2.5 pr-4 text-muted">Landed cost</td>
                        <td className="py-2.5 text-right font-mono tabular-nums">{formatINR(subtotal)}</td>
                      </tr>
                      <tr className="border-t border-line">
                        <td className="py-2.5 pr-4">
                          <span className="inline-flex items-center gap-2">
                            Margin <Badge tone="brand">{Math.round(MARGIN * 100)}%</Badge>
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-mono tabular-nums text-brand">+{formatINR(margin)}</td>
                      </tr>
                      <tr className="border-t border-line">
                        <td className="py-2.5 pr-4">GST @ {Math.round(GST * 100)}%</td>
                        <td className="py-2.5 text-right font-mono tabular-nums">{formatINR(gst)}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-ink">
                        <th scope="row" className="pt-3 text-left text-base font-semibold text-ink">
                          Quote total
                        </th>
                        <td className="pt-3 text-right font-mono text-lg font-medium tabular-nums text-ink">{formatINR(total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="mt-6 flex flex-wrap gap-2" aria-hidden>
                  <span className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-ink px-3.5 text-sm font-medium text-paper">
                    <FileDown className="size-4" /> Export PDF
                  </span>
                  <span className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-line-strong px-3.5 text-sm font-medium text-ink">
                    <Send className="size-4" /> Send to logistics
                  </span>
                </div>
              </div>
              <figcaption className="mt-6 text-center text-xs text-muted">Illustrative preview. Figures are examples, not a valuation.</figcaption>
            </figure>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-line bg-surface py-24">
        <div className="container-page">
          <Reveal>
            <SectionHeading eyebrow="What it does" title="Everything a quote needs, nothing you retype" />
          </Reveal>
          <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <StaggerItem key={f.title}>
                <div className="group h-full rounded-3xl border border-line bg-surface-2 p-7 transition-[border-color,box-shadow] duration-300 hover:border-line-strong hover:shadow-md">
                  <span className="grid size-11 place-items-center rounded-xl bg-ink text-paper transition-transform duration-300 group-hover:-rotate-6">
                    <f.icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-6 text-lg font-semibold text-ink">{f.title}</h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{f.text}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="container-page py-24">
        <Reveal>
          <SectionHeading align="center" eyebrow="How it works" title="Three steps to a sendable quote" />
        </Reveal>
        <Stagger as="ol" className="mt-12 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <StaggerItem as="li" key={s.title}>
              <div className="h-full rounded-3xl border border-line bg-surface p-7">
                <span className="font-serif text-[3rem] italic leading-none text-copper">{i + 1}</span>
                <h3 className="mt-4 text-lg font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{s.text}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="container-page pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-[32px] bg-ink px-6 py-14 text-center text-paper sm:px-16" style={{ colorScheme: "dark" }}>
            <div className="bg-grid absolute inset-0 opacity-40" aria-hidden />
            <p className="eyebrow relative !text-paper/60">Requires the {plan.name} plan</p>
            <h2 className="relative mt-3 text-[2rem] font-semibold leading-tight sm:text-[2.6rem]">
              Quote with confidence. <span className="font-serif font-normal italic text-copper">Bid with a buyer lined up.</span>
            </h2>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/dashboard/quotes" variant="copper" size="lg" iconRight={<ArrowRight className="size-4" />}>
                Open Quote Builder
              </ButtonLink>
              <ButtonLink href="/pricing" size="lg" className="border border-paper/20 bg-transparent text-paper hover:bg-paper/10">
                Compare plans
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
