import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Info, Newspaper } from "lucide-react";
import { NEWS, type NewsItem } from "@/content/news";
import { formatDate } from "@/lib/format";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Accent, Badge, EmptyState, SectionHeading } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Bulletin: platform updates and auction explainers",
  description: "What changed on Lelam, plus short explainers on auction rules, GST under reverse charge and scrapping regulations.",
  alternates: { canonical: "/news" },
};

const KIND_TONE: Record<NewsItem["kind"], "brand" | "copper" | "warning"> = {
  Platform: "brand",
  Explainer: "copper",
  Regulation: "warning",
};

const monthFmt = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" });

function groupByMonth(items: NewsItem[]) {
  const sorted = [...items].sort((a, b) => b.date.localeCompare(a.date));
  const groups = new Map<string, { label: string; items: NewsItem[] }>();
  for (const item of sorted) {
    const key = item.date.slice(0, 7);
    const g = groups.get(key) ?? { label: monthFmt.format(new Date(item.date)), items: [] };
    g.items.push(item);
    groups.set(key, g);
  }
  return Array.from(groups, ([key, g]) => ({ key, ...g }));
}

export default function NewsPage() {
  const months = groupByMonth(NEWS);
  return (
    <>
      <section className="relative overflow-hidden pb-10 pt-14 sm:pt-20">
        <div className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" aria-hidden />
        <div className="container-page">
          <Reveal>
            <SectionHeading
              as="h1"
              eyebrow="Bulletin"
              title={
                <>
                  What&apos;s new, and what the <Accent>rules</Accent> say
                </>
              }
              description="Product updates from the Lelam team and plain-English explainers on the regulations that shape public auctions."
            />
          </Reveal>
          <Reveal delay={0.05} className="mt-8">
            <div role="note" className="flex max-w-2xl items-start gap-3 rounded-2xl border border-dashed border-line-strong bg-surface-2 p-4 text-sm text-muted">
              <Info className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
              <p>
                Every item here is written by Lelam. Live third-party market news (metal indices, court rulings, industry press) needs a licensed news feed,
                so it is not reproduced on this page.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container-page max-w-4xl pb-24">
        {months.length === 0 ? (
          <EmptyState icon={<Newspaper className="size-5" aria-hidden />} title="No bulletins yet" description="Platform updates and explainers will appear here." />
        ) : (
          <div className="flex flex-col gap-14">
            {months.map((m) => (
              <section key={m.key} aria-labelledby={`month-${m.key}`}>
                <h2 id={`month-${m.key}`} className="eyebrow">
                  {m.label}
                </h2>
                <Stagger as="ol" className="mt-4 flex flex-col gap-4 border-l border-line pl-5 sm:pl-8">
                  {m.items.map((n) => {
                    const body = (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={KIND_TONE[n.kind]}>{n.kind}</Badge>
                          <time dateTime={n.date} className="text-[0.82rem] text-muted">
                            {formatDate(n.date)}
                          </time>
                        </div>
                        <h3 className="mt-3 text-lg font-semibold leading-snug text-ink transition-colors group-hover:text-brand">{n.title}</h3>
                        <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{n.summary}</p>
                        {n.href && (
                          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand">
                            Read more
                            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
                          </span>
                        )}
                      </>
                    );
                    return (
                      <StaggerItem as="li" key={n.id} className="relative">
                        <span aria-hidden className="absolute -left-[25px] top-7 size-2.5 rounded-full border-2 border-paper bg-line-strong sm:-left-[37px]" />
                        {n.href ? (
                          <Link
                            href={n.href}
                            className="group block rounded-3xl border border-line bg-surface p-6 transition-[border-color,box-shadow] duration-300 hover:border-line-strong hover:shadow-md"
                          >
                            {body}
                          </Link>
                        ) : (
                          <article className="rounded-3xl border border-line bg-surface p-6">{body}</article>
                        )}
                      </StaggerItem>
                    );
                  })}
                </Stagger>
              </section>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
