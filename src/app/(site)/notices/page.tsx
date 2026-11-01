import type { Metadata } from "next";
import { ArrowRight, BellOff, Megaphone } from "lucide-react";
import { NOTICES } from "@/content/news";
import { formatDate } from "@/lib/format";
import { SUPPORT } from "@/lib/site";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Accent, EmptyState, SectionHeading } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Official notices from Lelam",
  description: "Formal announcements from Lelam about independence, catalog accuracy, security and service changes.",
  alternates: { canonical: "/notices" },
};

export default function NoticesPage() {
  const notices = [...NOTICES].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <section className="relative overflow-hidden pb-10 pt-14 sm:pt-20">
        <div className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" aria-hidden />
        <div className="container-page">
          <Reveal>
            <SectionHeading
              as="h1"
              eyebrow="Notices"
              title={
                <>
                  Official word from <Accent>Lelam</Accent>
                </>
              }
              description="Formal announcements that affect how you use the platform. If a message claiming to be from Lelam contradicts a notice here, trust this page."
            />
          </Reveal>
        </div>
      </section>

      <section className="container-page max-w-4xl pb-24">
        {notices.length === 0 ? (
          <EmptyState
            icon={<BellOff className="size-5" aria-hidden />}
            title="No notices right now"
            description="When we publish an official announcement, it will appear here first."
            action={
              <ButtonLink href="/news" variant="secondary">
                Read the bulletin
              </ButtonLink>
            }
          />
        ) : (
          <Stagger as="ol" className="flex flex-col gap-5">
            {notices.map((n, i) => (
              <StaggerItem as="li" key={n.id}>
                <article id={n.id} aria-labelledby={`${n.id}-title`} className="scroll-mt-28 rounded-3xl border border-line bg-surface p-6 sm:p-8">
                  <div className="flex flex-col gap-5 sm:flex-row sm:gap-8">
                    <div className="flex shrink-0 items-center gap-3 sm:w-40 sm:flex-col sm:items-start">
                      <span className="grid size-11 place-items-center rounded-2xl bg-copper-soft text-copper">
                        <Megaphone className="size-5" aria-hidden />
                      </span>
                      <div>
                        <p className="eyebrow">Notice {String(notices.length - i).padStart(2, "0")}</p>
                        <time dateTime={n.date} className="mt-1 block text-sm font-medium text-ink-2">
                          {formatDate(n.date)}
                        </time>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h2 id={`${n.id}-title`} className="text-xl font-semibold leading-snug text-ink">
                        {n.title}
                      </h2>
                      <p className="mt-3 leading-relaxed text-muted">{n.body}</p>
                    </div>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        )}

        <Reveal className="mt-10">
          <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-dashed border-line-strong bg-surface-2 p-6 sm:flex-row sm:items-center">
            <p className="text-[0.95rem] text-muted">
              Seen something suspicious, like a request to pay EMD to a Lelam account? Report it to{" "}
              <a href={`mailto:${SUPPORT.email}`} className="font-medium text-brand underline underline-offset-4">
                {SUPPORT.email}
              </a>
              .
            </p>
            <ButtonLink href="/contact" variant="secondary" size="sm" className="h-11" iconRight={<ArrowRight className="size-4" />}>
              Contact support
            </ButtonLink>
          </div>
        </Reveal>
      </section>
    </>
  );
}
