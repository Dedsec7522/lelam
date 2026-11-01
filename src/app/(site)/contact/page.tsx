import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import { SUPPORT } from "@/lib/site";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Accent, SectionHeading } from "@/components/ui/primitives";
import { ContactPanels } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact Lelam: support and sales",
  description: "Reach Lelam support about payments, subscriptions, bidding help or catalog issues, or talk to sales about Enterprise plans. Mon–Sat, 9:00–18:00 IST.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const tel = SUPPORT.phone.replace(/\s+/g, "");

  const cards = [
    {
      icon: MapPin,
      label: "Office",
      body: (
        <address className="not-italic">
          {SUPPORT.address.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </address>
      ),
    },
    {
      icon: Phone,
      label: "Phone",
      body: (
        <a href={`tel:${tel}`} className="inline-flex min-h-11 items-center font-medium text-ink underline-offset-4 hover:text-brand hover:underline">
          {SUPPORT.phone}
        </a>
      ),
    },
    {
      icon: Mail,
      label: "Email",
      body: (
        <ul className="flex flex-col">
          <li>
            <a href={`mailto:${SUPPORT.email}`} className="inline-flex min-h-11 items-center break-all font-medium text-ink underline-offset-4 hover:text-brand hover:underline">
              {SUPPORT.email}
            </a>
            <span className="block text-xs text-muted">Support, payments, accounts</span>
          </li>
          <li className="mt-2">
            <a href={`mailto:${SUPPORT.businessEmail}`} className="inline-flex min-h-11 items-center break-all font-medium text-ink underline-offset-4 hover:text-brand hover:underline">
              {SUPPORT.businessEmail}
            </a>
            <span className="block text-xs text-muted">Enterprise and partnerships</span>
          </li>
        </ul>
      ),
    },
    {
      icon: Clock,
      label: "Hours",
      body: (
        <p>
          {SUPPORT.hours}
          <span className="mt-1 block text-xs text-muted">Closed on Sundays and national holidays.</span>
        </p>
      ),
    },
  ];

  return (
    <section className="relative overflow-hidden pb-24 pt-14 sm:pt-20">
      <div className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top_left,black_25%,transparent_65%)]" aria-hidden />
      <div className="container-page">
        <Reveal>
          <SectionHeading
            as="h1"
            eyebrow="Contact"
            title={
              <>
                Talk to a <Accent>real person</Accent>
              </>
            }
            description="Questions about a payment, a catalog or your plan? Tell us what happened and we will pick it up within one working day."
          />
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:gap-14">
          <div>
            <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {cards.map((c) => (
                <StaggerItem key={c.label}>
                  <div className="flex h-full gap-4 rounded-3xl border border-line bg-surface p-5">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand-ink">
                      <c.icon className="size-5" aria-hidden />
                    </span>
                    <div className="min-w-0 text-[0.95rem] leading-relaxed text-ink-2">
                      <p className="eyebrow mb-1">{c.label}</p>
                      {c.body}
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
            <Reveal className="mt-4">
              <div role="note" className="rounded-3xl border border-dashed border-line-strong bg-surface-2 p-5 text-sm leading-relaxed text-muted">
                <p className="font-medium text-ink">Before you write</p>
                <p className="mt-1">
                  Lelam never collects EMD or places bids. For an EMD refund or a bid that failed on the portal, contact the auctioning office listed on the lot. Many
                  answers are already in the{" "}
                  <Link href="/faq" className="inline-flex items-center gap-1 font-medium text-brand underline underline-offset-4">
                    help centre
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                  .
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.05}>
            <Suspense fallback={<div className="h-[560px] rounded-3xl skeleton" aria-hidden />}>
              <ContactPanels />
            </Suspense>
            <p className="mt-4 flex items-center gap-2 text-sm text-muted">
              <Clock className="size-4 shrink-0 text-brand" aria-hidden />
              Messages sent outside {SUPPORT.hours} are answered on the next working day.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
