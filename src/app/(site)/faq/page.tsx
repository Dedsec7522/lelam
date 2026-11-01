import type { Metadata } from "next";
import { ArrowRight, LifeBuoy, MessageCircle } from "lucide-react";
import { FAQS } from "@/content/faqs";
import { SUPPORT } from "@/lib/site";
import { Reveal } from "@/components/motion/reveal";
import { Accent, SectionHeading } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { FaqCentre } from "./faq-centre";

export const metadata: Metadata = {
  title: "Help centre: e-auction and Lelam FAQs",
  description: "Answers on where bids are placed, EMD deposits and refunds, auto-extensions, PCB documents, GST under reverse charge, plans and billing.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />
      <section className="relative overflow-hidden pb-24 pt-14 sm:pt-20">
        <div className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black_25%,transparent_65%)]" aria-hidden />
        <div className="container-page">
          <Reveal>
            <div className="mb-6 flex justify-center">
              <span className="grid size-14 place-items-center rounded-2xl border border-line bg-surface text-brand shadow-sm">
                <LifeBuoy className="size-6" aria-hidden />
              </span>
            </div>
            <SectionHeading
              as="h1"
              align="center"
              eyebrow="Help centre"
              title={
                <>
                  Answers before the <Accent>hammer falls</Accent>
                </>
              }
              description="How public auctions work, how EMD moves, and how to get the most from Lelam. Start typing to filter."
            />
          </Reveal>
          <div className="mt-10">
            <FaqCentre />
          </div>
        </div>
      </section>

      <section className="container-page pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-[32px] bg-ink px-6 py-12 text-paper sm:px-14" style={{ colorScheme: "dark" }}>
            <div className="bg-grid absolute inset-0 opacity-40" aria-hidden />
            <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
              <div className="max-w-xl">
                <p className="eyebrow !text-paper/60">Still stuck?</p>
                <h2 className="mt-3 text-[1.8rem] font-semibold leading-tight sm:text-[2.2rem]">
                  Ask a person. <span className="font-serif font-normal italic text-copper">We reply within a working day.</span>
                </h2>
                <p className="mt-3 text-[0.95rem] text-paper/70">Support hours: {SUPPORT.hours}.</p>
              </div>
              <ButtonLink href="/contact" variant="copper" size="lg" iconRight={<ArrowRight className="size-4" />}>
                <MessageCircle className="size-4" aria-hidden />
                Contact support
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
