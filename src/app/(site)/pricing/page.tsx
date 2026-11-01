import type { Metadata } from "next";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { FAQS } from "@/content/faqs";
import { ComparisonTable, PricingPlans } from "@/components/pricing/pricing-plans";
import { Reveal } from "@/components/motion/reveal";
import { Accordion } from "@/components/ui/accordion";
import { Accent, SectionHeading } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pricing: plans for auction bidders and businesses",
  description: "Start free. Individual ₹799/month and Business ₹1,499/month add landed-cost tools, Bid Intelligence and the Quote Builder. Save 12% yearly.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  const faqs = FAQS.filter((f) => f.group === "billing");
  return (
    <>
      <section className="relative overflow-hidden pb-16 pt-14 sm:pt-20">
        <div className="hero-glow absolute inset-0 -z-20" aria-hidden />
        <div className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]" aria-hidden />
        <div className="container-page">
          <Reveal>
            <SectionHeading
              as="h1"
              align="center"
              eyebrow="Pricing"
              title={
                <>
                  Pay for the tools, <Accent>not the listings.</Accent>
                </>
              }
              description="Searching every auction is free, forever. Upgrade when you want Lelam to do the valuation work for you."
            />
          </Reveal>
          <div className="mt-10">
            <PricingPlans />
          </div>
          <p className="mt-8 flex items-center justify-center gap-2 text-center text-sm text-muted">
            <ShieldCheck className="size-4 shrink-0 text-brand" aria-hidden /> Prices exclude 18% GST. Cancel any time, with a 7-day refund on your first payment.
          </p>
        </div>
      </section>

      <section className="container-page py-16">
        <Reveal>
          <SectionHeading align="center" eyebrow="Compare" title="Every feature, side by side" />
        </Reveal>
        <Reveal className="mt-10">
          <ComparisonTable />
        </Reveal>
      </section>

      <section className="container-page py-16">
        <Reveal>
          <div className="relative overflow-hidden rounded-[32px] bg-ink px-8 py-14 text-center text-paper sm:px-16" style={{ colorScheme: "dark" }}>
            <div className="bg-grid absolute inset-0 opacity-40" aria-hidden />
            <h2 className="relative text-[2rem] font-semibold leading-tight sm:text-[2.6rem]">
              Your next lot is already listed. <span className="font-serif font-normal italic text-copper">Find it free.</span>
            </h2>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/auth/register" variant="copper" size="lg" iconRight={<ArrowRight className="size-4" />}>
                Start free, no card needed
              </ButtonLink>
              <ButtonLink href="/contact?topic=sales" size="lg" className="border border-paper/20 bg-transparent text-paper hover:bg-paper/10">
                Talk to sales
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="container-page grid gap-10 py-16 lg:grid-cols-[1fr_1.5fr]">
        <Reveal>
          <SectionHeading eyebrow="Billing FAQ" title="Plans & billing questions" />
        </Reveal>
        <Reveal delay={0.1}>
          <Accordion items={faqs.map((f) => ({ id: f.id, title: f.q, content: f.a }))} />
        </Reveal>
      </section>
    </>
  );
}
