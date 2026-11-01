import type { Metadata } from "next";
import { ArrowRight, Check, Compass, Eye, Landmark, Minus, Scale, ShieldCheck, Sprout } from "lucide-react";
import { CATEGORIES } from "@/lib/taxonomy";
import { catalog } from "@/server/catalog";
import { Reveal, Stagger, StaggerItem, WordReveal } from "@/components/motion/reveal";
import { CountUp } from "@/components/motion/count-up";
import { Accent, SectionHeading } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About Lelam: public auctions, made easy to discover",
  description:
    "Lelam is an independent auction-intelligence platform from Trivandrum. We want finding a public auction in India to be as simple as booking a flight.",
  alternates: { canonical: "/about" },
};

// Catalog-derived numbers: regenerate alongside the home page.
export const revalidate = 1800;

const PRINCIPLES = [
  {
    icon: Landmark,
    title: "Independent, always",
    text: "We are not a portal, a bank or a government body, and we take no commission from sellers. That keeps our analysis on the buyer's side of the table.",
  },
  {
    icon: Eye,
    title: "Show the whole cost",
    text: "A hammer price is not a price. Every lot shows tax, TCS, transport and loading so nobody discovers the real number after they have won.",
  },
  {
    icon: Scale,
    title: "Honest about uncertainty",
    text: "Valuations are indicative and labelled as such. When a catalog is ambiguous, we say so rather than guess with confidence.",
  },
  {
    icon: ShieldCheck,
    title: "Hands off your money",
    text: "We never collect EMD and never bid for you. Payments for lots go to the official portal or seller, where they belong.",
  },
  {
    icon: Compass,
    title: "Plain language first",
    text: "SARFAESI, STC, RCM and lifting periods explained the way a colleague would explain them, not the way a tender document does.",
  },
  {
    icon: Sprout,
    title: "Built for first-timers too",
    text: "Seasoned traders know where to look. We are building for the shop owner, the recycler and the young founder who never knew these auctions existed.",
  },
];

const COMPARISON: { label: string; usual: string; lelam: string }[] = [
  { label: "Finding lots", usual: "Check several portals, each with its own search and vocabulary", lelam: "One plain-English search across sources, filtered the way traders think" },
  { label: "Reading catalogs", usual: "40-page PDFs and scanned terms, read the night before inspection", lelam: "Lots extracted into structured fields with the key terms surfaced" },
  { label: "Knowing the cost", usual: "Hammer price only; tax and transport worked out later", lelam: "Landed cost with GST, TCS, transport and loading before you bid" },
  { label: "Timing", usual: "Inspection and bid dates kept in someone's head", lelam: "Watchlists with reminders before inspection and bidding windows" },
  { label: "Whose side", usual: "Information shaped by whoever is selling", lelam: "Independent analysis with no seller commission" },
];

export default function AboutPage() {
  const all = catalog().list();
  const stats = [
    { value: CATEGORIES.length, label: "asset categories organised for buyers" },
    { value: all.length, label: "lots indexed in the marketplace today" },
    { value: new Set(all.map((a) => a.state)).size, label: "states and union territories with listings" },
    { value: 0, label: "rupees of EMD ever held by Lelam" },
  ];

  return (
    <>
      {/* Hero: centred display line over a grid, with the origin story set as a tagline row */}
      <section className="relative overflow-hidden border-b border-line pb-20 pt-16 sm:pt-24">
        <div className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" aria-hidden />
        <div className="container-page text-center">
          <p className="eyebrow">About Lelam</p>
          <WordReveal
            as="h1"
            text="Every public auction, as easy to find as a flight."
            accentWords={["flight"]}
            accentClassName="font-serif font-normal italic tracking-normal text-brand"
            className="mx-auto mt-5 max-w-4xl text-[2.4rem] font-semibold leading-[1.05] text-ink sm:text-[3.6rem] lg:text-[4.4rem]"
          />
          <Reveal delay={0.35}>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-muted">
              Lelam is an independent auction-intelligence platform, started in Trivandrum and now run from Bengaluru. We turn scattered government, bank and
              liquidation sales into one searchable, priced and explained marketplace.
            </p>
            <ul className="mt-8 flex flex-wrap items-center justify-center gap-2 text-[0.82rem] text-ink-2">
              {["Born in Trivandrum", "Not affiliated with any portal", "No bidding on your behalf"].map((t) => (
                <li key={t} className="rounded-full border border-line bg-surface px-3.5 py-1.5">
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Story: vision and mission as two contrasting panels */}
      <section className="container-page py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-start">
          <Reveal>
            <p className="eyebrow">Why we exist</p>
            <h2 className="mt-3 text-[2rem] font-semibold leading-[1.1] text-ink sm:text-[2.5rem]">
              Billions in public assets change hands every year. <Accent>Most people never hear about it.</Accent>
            </h2>
            <div className="mt-6 space-y-4 text-[1.02rem] leading-relaxed text-muted">
              <p>
                Scrap from rail yards, vehicles from police compounds, timber from forest depots, flats recovered by banks: all of it is sold in the open, on
                public portals. In practice, the open door is hard to find. Listings are spread across sites, catalogs live in PDFs, and the true cost only shows
                up after the hammer falls.
              </p>
              <p>
                We started Lelam because that gap rewards the few who already know where to look. Our job is to close it, so that a small recycler in Kollam has
                the same view of the market as a large trading desk in Mumbai.
              </p>
            </div>
          </Reveal>
          <Stagger className="grid gap-4">
            <StaggerItem>
              <div className="rounded-3xl bg-ink p-8 text-paper" style={{ colorScheme: "dark" }}>
                <p className="eyebrow !text-paper/60">Vision</p>
                <p className="mt-3 text-[1.35rem] font-medium leading-snug">
                  A country where anyone can discover, understand and confidently bid on a public auction, without needing an insider.
                </p>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="rounded-3xl border border-line bg-surface p-8">
                <p className="eyebrow !text-copper">Mission</p>
                <p className="mt-3 text-[1.15rem] leading-relaxed text-ink-2">
                  Gather every credible public sale into one place, explain it in plain language, and put a realistic price on it, so buyers spend their time
                  deciding, not searching.
                </p>
              </div>
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* Numbers strip */}
      <section aria-label="Lelam in numbers" className="border-y border-line bg-surface">
        <div className="container-page">
          <dl className="grid grid-cols-2 divide-line lg:grid-cols-4 lg:divide-x">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col-reverse px-2 py-10 sm:px-6">
                <dt className="mt-3 max-w-[16rem] text-sm leading-snug text-muted">{s.label}</dt>
                <dd>
                  <CountUp value={s.value} className="block font-mono text-[2.6rem] font-medium leading-none tabular-nums text-ink sm:text-[3.2rem]" />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Principles */}
      <section className="container-page py-24">
        <Reveal>
          <SectionHeading
            eyebrow="Principles"
            title={
              <>
                Six promises we <Accent>build against</Accent>
              </>
            }
            description="When a feature idea conflicts with one of these, the principle wins."
          />
        </Reveal>
        <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRINCIPLES.map((p, i) => (
            <StaggerItem key={p.title}>
              <div className="group h-full rounded-3xl border border-line bg-surface p-7 transition-[border-color,box-shadow] duration-300 hover:border-line-strong hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand-ink transition-transform duration-300 group-hover:-rotate-6">
                    <p.icon className="size-5" aria-hidden />
                  </span>
                  <span className="font-mono text-sm tabular-nums text-faint">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="mt-6 text-lg font-semibold text-ink">{p.title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{p.text}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* How we're different */}
      <section className="bg-paper-2/60 py-24">
        <div className="container-page">
          <Reveal>
            <SectionHeading align="center" eyebrow="How we're different" title="The usual way, and the Lelam way" />
          </Reveal>
          <Reveal className="mt-12">
            <div className="overflow-hidden rounded-3xl border border-line bg-surface">
              <div className="hidden grid-cols-[180px_1fr_1fr] border-b border-line bg-surface-2 text-sm font-semibold md:grid" aria-hidden>
                <span className="px-6 py-4 text-muted">Step</span>
                <span className="px-6 py-4 text-muted">The usual way</span>
                <span className="px-6 py-4 text-brand">With Lelam</span>
              </div>
              <ul>
                {COMPARISON.map((row) => (
                  <li key={row.label} className="grid gap-3 border-b border-line p-6 last:border-b-0 md:grid-cols-[180px_1fr_1fr] md:gap-0 md:p-0">
                    <p className="font-semibold text-ink md:px-6 md:py-5">{row.label}</p>
                    <p className="flex items-start gap-2.5 text-[0.95rem] text-muted md:px-6 md:py-5">
                      <Minus className="mt-1 size-4 shrink-0 text-faint" aria-hidden />
                      <span>
                        <span className="sr-only">The usual way: </span>
                        {row.usual}
                      </span>
                    </p>
                    <p className="flex items-start gap-2.5 text-[0.95rem] text-ink-2 md:bg-brand-soft/40 md:px-6 md:py-5">
                      <Check className="mt-1 size-4 shrink-0 text-brand" aria-hidden />
                      <span>
                        <span className="sr-only">With Lelam: </span>
                        {row.lelam}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-[32px] bg-ink px-6 py-14 text-center text-paper sm:px-16" style={{ colorScheme: "dark" }}>
            <div className="bg-grid absolute inset-0 opacity-40" aria-hidden />
            <h2 className="relative text-[2rem] font-semibold leading-tight sm:text-[2.6rem]">
              The next lot is already listed. <span className="font-serif font-normal italic text-copper">Go find it.</span>
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-paper/70">Searching is free. Upgrade only when you want Lelam to do the valuation work.</p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/auctions" variant="copper" size="lg" iconRight={<ArrowRight className="size-4" />}>
                Explore auctions
              </ButtonLink>
              <ButtonLink href="/contact" size="lg" className="border border-paper/20 bg-transparent text-paper hover:bg-paper/10">
                Get in touch
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
