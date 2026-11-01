import type { ReactNode } from "react";
import Link from "next/link";
import { Scale } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/ui/primitives";
import { LegalToc } from "./legal-toc";

export const LEGAL_LAST_UPDATED = { iso: "2026-11-01", label: "1 November 2026" } as const;

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

/** Shared shell for Terms, Privacy and Cookies: hero, counsel note, sticky scroll-spy TOC, numbered sections. */
export function LegalLayout({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string;
  title: ReactNode;
  intro: ReactNode;
  sections: LegalSection[];
}) {
  const entries = sections.map((s) => ({ id: s.id, title: s.title }));
  return (
    <>
      <section className="relative overflow-hidden border-b border-line pb-12 pt-14 sm:pt-20">
        <div className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top_left,black_25%,transparent_70%)]" aria-hidden />
        <div className="container-page">
          <Reveal>
            <SectionHeading as="h1" eyebrow={eyebrow} title={title} description={intro} />
            <p className="mt-6 text-sm text-muted">
              Last updated <time dateTime={LEGAL_LAST_UPDATED.iso}>{LEGAL_LAST_UPDATED.label}</time>
            </p>
          </Reveal>
        </div>
      </section>

      <div className="container-page grid gap-10 py-12 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-14 lg:py-16">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <LegalToc entries={entries} />
        </aside>

        <div className="min-w-0 max-w-3xl">
          <div role="note" className="mb-10 flex items-start gap-3 rounded-2xl border border-dashed border-line-strong bg-surface-2 p-4 text-sm text-muted">
            <Scale className="mt-0.5 size-4 shrink-0 text-copper" aria-hidden />
            <p>
              <strong className="font-semibold text-ink">Template notice.</strong> This document is a working template prepared for the Lelam rebuild.
              It must be reviewed and approved by qualified legal counsel before it is relied on. Questions:{" "}
              <Link href="/contact" className="text-brand underline underline-offset-4">
                contact us
              </Link>
              .
            </p>
          </div>

          <div className="prose-lelam">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="scroll-mt-28">
                <h2 id={`${s.id}-title`} className="flex items-baseline gap-3 first:mt-0">
                  <span className="font-mono text-[0.85rem] font-normal tabular-nums text-faint">{String(i + 1).padStart(2, "0")}</span>
                  {s.title}
                </h2>
                {s.body}
              </section>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
