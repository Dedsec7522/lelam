import Link from "next/link";
import { ArrowRight, ExternalLink, Server } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

/**
 * Shown in the static GitHub Pages demo in place of routes that need the server
 * (sign-in, dashboards, seller/logistics/admin portals, checkout).
 */
export function DemoNotice({ feature }: { feature: string }) {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="hero-glow absolute inset-0 -z-10" aria-hidden />
      <div className="container-page max-w-2xl text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand-ink">
          <Server className="size-6" aria-hidden />
        </span>
        <p className="eyebrow mt-6">Static demo</p>
        <h1 className="mt-3 text-[2rem] font-semibold leading-tight tracking-[-0.025em] text-ink sm:text-[2.4rem]">{feature} needs the full app</h1>
        <p className="mx-auto mt-4 max-w-xl text-[1.02rem] leading-relaxed text-muted">
          This GitHub Pages site is a static preview. The marketplace, auction pages, pricing, insights and help centre all work here, but
          accounts, saved data and payments need the Node.js server. Run the project locally or deploy it to a Node host to try them.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/auctions" iconRight={<ArrowRight className="size-4" />}>
            Browse auctions
          </ButtonLink>
          <a
            href="https://github.com/Dedsec7522/lelam#run-it"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-line-strong bg-surface px-5 text-[0.95rem] font-medium text-ink hover:bg-surface-2"
          >
            How to run it <ExternalLink className="size-4" aria-hidden />
            <span className="sr-only">(opens GitHub in a new tab)</span>
          </a>
        </div>
        <p className="mt-6 text-sm text-muted">
          Or go back to the{" "}
          <Link href="/" className="text-brand underline underline-offset-4">
            home page
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
