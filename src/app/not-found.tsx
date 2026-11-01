import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="relative grid min-h-dvh place-items-center overflow-hidden px-5">
      <div className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" aria-hidden />
      <div className="max-w-lg text-center">
        <Logo className="justify-center" />
        <p className="mt-12 font-mono text-[5.5rem] font-semibold leading-none tracking-tighter text-ink">
          4<span className="text-copper">0</span>4
        </p>
        <h1 className="mt-4 text-2xl font-semibold text-ink">This lot isn&apos;t on the block</h1>
        <p className="mt-3 text-muted">The page may have moved, or the auction has closed and been removed from the catalog.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/auctions">
            <Search className="size-4" aria-hidden /> Search auctions
          </ButtonLink>
          <ButtonLink href="/" variant="secondary">
            <ArrowLeft className="size-4" aria-hidden /> Home
          </ButtonLink>
        </div>
        <p className="mt-8 text-sm text-muted">
          Think something&apos;s broken?{" "}
          <Link href="/contact" className="text-brand underline underline-offset-2">
            Tell us
          </Link>
        </p>
      </div>
    </main>
  );
}
