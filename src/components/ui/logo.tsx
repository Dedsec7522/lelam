import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Original wordmark: a gavel-strike mark (two offset bars forming an "L" with a copper strike point)
 * set beside "lelam" in tight sans. Not derived from the reference site's logo artwork.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect x="1" y="1" width="30" height="30" rx="9" className="fill-ink" />
      <rect x="9" y="7.5" width="4.5" height="17" rx="2.25" className="fill-paper" />
      <rect x="9" y="20" width="14" height="4.5" rx="2.25" className="fill-paper" />
      <circle cx="21.5" cy="11" r="3.2" className="fill-copper" />
    </svg>
  );
}

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 rounded-lg", className)} aria-label="Lelam home">
      <LogoMark />
      <span className="text-[1.3rem] font-semibold tracking-[-0.04em] text-ink">
        lelam<span className="text-copper">.</span>co
      </span>
    </Link>
  );
}
