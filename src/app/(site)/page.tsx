import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  BrainCircuit,
  Calculator,
  FileStack,
  FileText,
  Layers,
  LineChart,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { catalog } from "@/server/catalog";
import { serverNow } from "@/server/clock";
import { lotValue, statusOf } from "@/lib/search";
import { CATEGORIES } from "@/lib/taxonomy";
import { formatDate } from "@/lib/format";
import { postsByDate } from "@/content/blog";
import { FAQS } from "@/content/faqs";
import { Hero } from "@/components/home/hero";
import { ProcessLine } from "@/components/home/process-line";
import { LandedCostDemo } from "@/components/home/landed-cost-demo";
import { SalesForm } from "@/components/forms/sales-form";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Accent, SectionHeading } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
import { AuctionCard } from "@/components/auctions/auction-card";
import { WatchlistProvider } from "@/components/auctions/watch-button";
import { CATEGORY_ICONS } from "@/components/layout/nav-config";
import { LotArt } from "@/components/auctions/lot-art";
import { PostCover } from "@/components/content/post-cover";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, SUPPORT } from "@/lib/site";

// Catalog dates are relative to "today": regenerate the page every 30 minutes.
export const revalidate = 1800;

type ToolPreview = "cost" | "docs" | "alerts";

// Zig-zag bento (2+1 / 1+2 / 2+1) so every row is full; wide tiles carry a small product preview.
const TOOLS: { icon: typeof Calculator; title: string; text: string; hue: string; wide?: ToolPreview }[] = [
  { icon: Calculator, title: "Landed-cost estimator", text: "GST (incl. RCM), TCS, transport and loading on top of your bid, with ITC-aware totals.", hue: "var(--brand)", wide: "cost" },
  { icon: BrainCircuit, title: "Bid Intelligence", text: "Conservative, aggressive and walk-away caps with win probability for every lot.", hue: "var(--cat-vehicles)" },
  { icon: FileStack, title: "Quote Builder", text: "Turn a lot into an itemised commercial quote with margin, GST and a PDF export.", hue: "var(--cat-machinery)" },
  { icon: ShieldCheck, title: "Document vault", text: "PAN, GSTIN, PCB and transit passes in one place, with expiry reminders.", hue: "var(--cat-forest)", wide: "docs" },
  { icon: BellRing, title: "Alerts & reminders", text: "Keyword, category and state alerts, plus reminders before inspection and bidding.", hue: "var(--copper)", wide: "alerts" },
  { icon: Truck, title: "Logistics quotes", text: "Request transport quotes from partners straight from an auction.", hue: "var(--cat-minerals)" },
];

/** Decorative, static mini-UIs that show what each wide tool produces. */
function ToolPreviewArt({ kind }: { kind: ToolPreview }) {
  if (kind === "cost") {
    const parts = [
      { k: "Bid", v: 62, c: "bg-ink" },
      { k: "GST", v: 18, c: "bg-brand" },
      { k: "TCS", v: 4, c: "bg-copper" },
      { k: "Freight", v: 11, c: "bg-faint" },
      { k: "Loading", v: 5, c: "bg-line-strong" },
    ];
    return (
      <div className="rounded-2xl border border-line bg-surface-2 p-4 shadow-xs">
        <div className="flex items-baseline justify-between">
          <span className="text-[0.72rem] text-muted">Landed cost</span>
          <span className="font-mono text-sm font-semibold text-ink">₹6,22,700</span>
        </div>
        <div className="mt-3 flex h-2.5 gap-0.5 overflow-hidden rounded-full">
          {parts.map((p) => (
            <span key={p.k} className={`${p.c} h-full origin-left transition-transform duration-500 ease-[var(--ease-out-quint)] group-hover:scale-x-105`} style={{ width: `${p.v}%` }} />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[0.68rem] text-muted">
          {parts.map((p) => (
            <span key={p.k} className="inline-flex items-center gap-1">
              <span className={`size-1.5 rounded-full ${p.c}`} />
              {p.k}
            </span>
          ))}
        </div>
      </div>
    );
  }
  if (kind === "docs") {
    const docs = [
      { n: "GSTIN certificate", s: "Valid", tone: "bg-positive-soft text-positive" },
      { n: "PCB authorisation", s: "Expires in 21 days", tone: "bg-warning-soft text-warning" },
      { n: "PAN card", s: "Valid", tone: "bg-positive-soft text-positive" },
    ];
    return (
      <ul className="space-y-2">
        {docs.map((d, i) => (
          <li
            key={d.n}
            className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-[0.8rem] shadow-xs transition-transform duration-300 ease-[var(--ease-out-quint)] group-hover:translate-x-1"
            style={{ transitionDelay: `${i * 40}ms` }}
          >
            <span className="flex items-center gap-2 font-medium text-ink">
              <FileText className="size-3.5 text-faint" />
              {d.n}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[0.68rem] font-medium ${d.tone}`}>{d.s}</span>
          </li>
        ))}
      </ul>
    );
  }
  const alerts = [
    { t: "3 new lots match “copper scrap · Mumbai”", w: "2m" },
    { t: "Inspection closes tomorrow · #41744", w: "1h" },
  ];
  return (
    <ul className="space-y-2">
      {alerts.map((a, i) => (
        <li
          key={a.t}
          className="flex items-start gap-3 rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-[0.8rem] shadow-xs transition-transform duration-300 ease-[var(--ease-out-quint)] group-hover:-translate-y-0.5"
          style={{ transitionDelay: `${i * 40}ms` }}
        >
          <span className="mt-1 size-2 shrink-0 rounded-full bg-copper animate-pulse-dot text-copper" />
          <span className="flex-1 text-ink-2">{a.t}</span>
          <span className="font-mono text-[0.68rem] text-faint">{a.w}</span>
        </li>
      ))}
    </ul>
  );
}

export default function HomePage() {
  const now = serverNow();
  const all = catalog().list();
  const open = all.filter((a) => statusOf(a, now) !== "closed");
  const stats = {
    lots: all.length,
    open: open.length,
    states: new Set(all.map((a) => a.state)).size,
    value: all.reduce((s, a) => s + lotValue(a), 0),
  };
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c.id, open.filter((a) => a.category === c.id).length]));
  const soon = open.filter((a) => statusOf(a, now) === "upcoming").sort((a, b) => a.startsAt.localeCompare(b.startsAt)).slice(0, 6);
  const posts = postsByDate().slice(0, 3);
  const faqs = FAQS.filter((f) => ["how-bidding-works", "affiliation", "emd-refund", "gst-rcm", "valuation"].includes(f.id));

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "Organization", name: "Lelam", url: absoluteUrl("/"), email: SUPPORT.email, sameAs: ["https://www.linkedin.com/company/lelam-co/"] },
            {
              "@type": "WebSite",
              name: "Lelam",
              url: absoluteUrl("/"),
              potentialAction: { "@type": "SearchAction", target: `${absoluteUrl("/auctions")}?q={query}`, "query-input": "required name=query" },
            },
          ],
        }}
      />
      <Hero stats={stats} />

      {/* Sources strip */}
      <section aria-label="Sources" className="border-y border-line bg-surface">
        <div className="container-page flex flex-col items-center gap-4 py-6 text-sm text-muted sm:flex-row sm:justify-between">
          <p className="eyebrow">One search across</p>
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 font-medium text-ink-2">
            <li>MSTC e-auctions</li>
            <li>BaankNet bank properties</li>
            <li>SARFAESI · DRT · IBC sales</li>
            <li>GeM guides</li>
          </ul>
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-24">
        <Reveal>
          <SectionHeading
            eyebrow="Marketplace"
            title={
              <>
                Browse by what you <Accent>actually</Accent> buy
              </>
            }
            description="Verified government catalogs, bank-foreclosed properties and liquidation lots, organised the way traders think."
            action={
              <ButtonLink href="/auctions" variant="secondary" iconRight={<ArrowRight className="size-4" />}>
                All auctions
              </ButtonLink>
            }
          />
        </Reveal>
        <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((c, i) => {
            const Icon = CATEGORY_ICONS[c.id];
            return (
              // Grid: feature tile 2×2, then 4 singles, then the last two span 2 columns each so every row is full.
              <StaggerItem key={c.id} className={i === 0 ? "sm:col-span-2 lg:row-span-2" : i >= 5 ? "lg:col-span-2" : ""}>
                <Link
                  href={`/auctions?category=${c.id}`}
                  style={{ "--hue": `var(--cat-${c.id})` } as React.CSSProperties}
                  className="group relative flex h-full min-h-44 flex-col justify-between overflow-hidden rounded-3xl border border-line bg-surface p-6 shadow-sm transition-[border-color,box-shadow,transform] duration-300 ease-[var(--ease-out-quint)] hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--hue)_35%,var(--line))] hover:shadow-lg"
                >
                  {/* Hue wash that strengthens on hover */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-60 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: "radial-gradient(120% 80% at 100% 0%, color-mix(in srgb, var(--hue) 9%, transparent), transparent 60%)" }}
                  />
                  {i === 0 && <LotArt category={c.id} seed="7" showIcon={false} className="absolute inset-x-0 top-0 h-[46%] [mask-image:linear-gradient(to_bottom,black_55%,transparent)]" />}
                  <div className="relative flex items-start justify-between">
                    <span
                      className="grid size-12 place-items-center rounded-2xl transition-all duration-300 group-hover:scale-105 group-hover:-rotate-3"
                      style={{ background: "color-mix(in srgb, var(--hue) 13%, var(--surface))", color: "var(--hue)" }}
                    >
                      <Icon className="size-[22px]" aria-hidden />
                    </span>
                    <span className="rounded-full border border-line bg-surface/90 px-2.5 py-1 font-mono text-[0.72rem] text-ink-2 backdrop-blur">{counts[c.id]} open</span>
                  </div>
                  <div className="relative mt-8">
                    <h3 className={i === 0 ? "text-2xl font-semibold text-ink" : "text-lg font-semibold text-ink"}>{c.label}</h3>
                    <p className={`mt-2 text-[0.92rem] leading-relaxed text-muted ${i === 0 ? "max-w-md" : "line-clamp-2"}`}>{c.description}</p>
                    {i === 0 && (
                      <ul className="mt-5 flex flex-wrap gap-2">
                        {c.subCategories.map((s) => (
                          <li key={s} className="rounded-full border border-line px-3 py-1 text-[0.78rem] text-ink-2">
                            {s}
                          </li>
                        ))}
                      </ul>
                    )}
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand">
                      Browse
                      <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
                    </span>
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      </section>

      {/* Process */}
      <section className="border-y border-line bg-surface py-24">
        <div className="container-page">
          <Reveal>
            <SectionHeading align="center" eyebrow="How it works" title={<>From catalog to confident bid</>} />
          </Reveal>
          <div className="mt-16">
            <ProcessLine />
          </div>
        </div>
      </section>

      {/* Opening soon */}
      <section className="container-page py-24">
        <Reveal>
          <SectionHeading
            eyebrow="Opening soon"
            title="Next on the block"
            description="The next auctions to open for bidding. Save them to get reminders before inspection closes."
            action={
              <ButtonLink href="/auctions?status=upcoming" variant="secondary" iconRight={<ArrowRight className="size-4" />}>
                See all upcoming
              </ButtonLink>
            }
          />
        </Reveal>
        <WatchlistProvider>
          <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {soon.map((a) => (
              <StaggerItem key={a.id}>
                <AuctionCard auction={a} />
              </StaggerItem>
            ))}
          </Stagger>
        </WatchlistProvider>
        <Reveal className="mt-6">
          <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-dashed border-line-strong bg-surface-2 p-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <span className="grid size-11 place-items-center rounded-2xl bg-brand-soft text-brand-ink">
                <Layers className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-semibold text-ink">Personalised recommendations</p>
                <p className="text-sm text-muted">Tell us what you buy and where. Business members get matched lots every morning.</p>
              </div>
            </div>
            <ButtonLink href="/auth/register" size="sm">
              Create free account
            </ButtonLink>
          </div>
        </Reveal>
      </section>

      {/* Landed cost demo */}
      <section className="bg-paper-2/60 py-24">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Try it"
              title={
                <>
                  What will that lot <Accent>really</Accent> cost?
                </>
              }
              description="Move the sliders. This is the same maths Lelam runs on every listing: bid, tax, TCS, transport and loading."
            />
          </Reveal>
          <Reveal className="mt-12">
            <LandedCostDemo />
          </Reveal>
        </div>
      </section>

      {/* Tools bento */}
      <section className="container-page py-24">
        <Reveal>
          <SectionHeading eyebrow="Built-in tools" title="Everything between “found it” and “won it”" />
        </Reveal>
        <Stagger className="mt-12 grid gap-4 md:grid-cols-3">
          {TOOLS.map((t) => (
            <StaggerItem key={t.title} className={t.wide ? "md:col-span-2" : ""}>
              <div
                style={{ "--hue": t.hue } as React.CSSProperties}
                className={`group relative h-full overflow-hidden rounded-3xl border border-line bg-surface p-7 shadow-sm transition-[border-color,box-shadow,transform] duration-300 ease-[var(--ease-out-quint)] hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--hue)_30%,var(--line))] hover:shadow-lg ${
                  t.wide ? "grid items-center gap-7 md:grid-cols-[1fr_1.05fr]" : ""
                }`}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-50 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: "radial-gradient(90% 70% at 0% 0%, color-mix(in srgb, var(--hue) 8%, transparent), transparent 65%)" }}
                />
                <div className="relative">
                  <span
                    className="grid size-11 place-items-center rounded-xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105"
                    style={{ background: "color-mix(in srgb, var(--hue) 12%, var(--surface))", color: "var(--hue)" }}
                  >
                    <t.icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-6 text-lg font-semibold text-ink">{t.title}</h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{t.text}</p>
                </div>
                {t.wide && (
                  <div className="relative" aria-hidden>
                    <ToolPreviewArt kind={t.wide} />
                  </div>
                )}
              </div>
            </StaggerItem>
          ))}
        </Stagger>
        <Reveal className="mt-8 flex justify-center">
          <ButtonLink href="/pricing" variant="ink" iconRight={<ArrowRight className="size-4" />}>
            Compare plans
          </ButtonLink>
        </Reveal>
      </section>

      {/* Insights */}
      <section className="border-t border-line bg-surface py-24">
        <div className="container-page">
          <Reveal>
            <SectionHeading
              eyebrow="Insights"
              title="Know the rules before the hammer falls"
              action={
                <ButtonLink href="/blog" variant="secondary" iconRight={<ArrowRight className="size-4" />}>
                  All insights
                </ButtonLink>
              }
            />
          </Reveal>
          <Stagger className="mt-12 grid gap-6 md:grid-cols-3">
            {posts.map((p) => (
              <StaggerItem key={p.slug} as="article">
                <Link href={`/blog/${p.slug}`} className="group block">
                  <PostCover post={p} className="aspect-[16/10] rounded-2xl" />
                  <p className="mt-4 flex items-center gap-2 text-[0.8rem] text-muted">
                    <span className="font-medium text-brand">{p.tag}</span>·<time dateTime={p.date}>{formatDate(p.date)}</time>·{p.minutes} min
                  </p>
                  <h3 className="mt-2 text-lg font-semibold leading-snug text-ink transition-colors group-hover:text-brand">{p.title}</h3>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Enterprise */}
      <section className="relative overflow-hidden bg-ink py-24 text-paper" style={{ colorScheme: "dark" }}>
        <div className="bg-grid absolute inset-0 opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
        <div className="container-page relative grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <p className="eyebrow !text-paper/60">Enterprise & B2B</p>
            <h2 className="mt-3 text-[2.2rem] font-semibold leading-tight sm:text-[2.8rem]">
              Buying at volume? <span className="font-serif font-normal italic text-copper">Let&apos;s build your desk.</span>
            </h2>
            <p className="mt-5 max-w-lg text-[1.02rem] leading-relaxed text-paper/70">
              Catalog specialists, custom commodity indices, bulk alerts over email, SMS and WhatsApp, API access and SSO for your team.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                { icon: FileText, t: "Dedicated catalog specialist for valuation, EMD refunds and document checks" },
                { icon: LineChart, t: "Custom indices and bulk analytics across your categories and states" },
                { icon: ShieldCheck, t: "SSO, audit trail and a dedicated account manager" },
              ].map((x) => (
                <li key={x.t} className="flex items-start gap-3 text-[0.95rem] text-paper/80">
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-paper/10">
                    <x.icon className="size-4" aria-hidden />
                  </span>
                  {x.t}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <SalesForm />
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="container-page grid gap-12 py-24 lg:grid-cols-[1fr_1.4fr]">
        <Reveal>
          <SectionHeading eyebrow="FAQ" title="Questions, answered" description="Short answers to what new bidders ask most." />
          <ButtonLink href="/faq" variant="secondary" className="mt-8" iconRight={<ArrowRight className="size-4" />}>
            Visit help centre
          </ButtonLink>
        </Reveal>
        <Reveal delay={0.1}>
          <Accordion items={faqs.map((f) => ({ id: f.id, title: f.q, content: f.a }))} defaultOpen={faqs[0]?.id} />
        </Reveal>
      </section>
    </>
  );
}
