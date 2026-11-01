import Link from "next/link";
import { Mail } from "lucide-react";

function LinkedinGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11H3v-11Zm7 0h3.8v1.5h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.1v5.46h-4v-4.84c0-1.15-.02-2.64-1.6-2.64-1.62 0-1.86 1.26-1.86 2.56v4.92H10v-11Z" />
    </svg>
  );
}
import { Logo } from "@/components/ui/logo";
import { FOOTER_GROUPS } from "./nav-config";
import { NewsletterForm } from "./newsletter-form";

export function Footer() {
  return (
    <footer className="relative border-t border-line bg-surface pb-24 lg:pb-0">
      <div className="container-page grid gap-12 py-16 lg:grid-cols-[1.3fr_2fr]">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-5 text-[0.95rem] leading-relaxed text-muted">
            Independent auction intelligence for India. One search across government and bank auctions, with the costs worked out
            before you bid.
          </p>
          <NewsletterForm />
          <div className="mt-6 flex items-center gap-2">
            <a
              href="mailto:support@lelam.co"
              className="grid size-10 place-items-center rounded-full border border-line text-ink-2 transition-colors hover:border-ink/30 hover:text-ink"
              aria-label="Email support"
            >
              <Mail className="size-4" />
            </a>
            <a
              href="https://www.linkedin.com/company/lelam-co/"
              target="_blank"
              rel="noopener noreferrer"
              className="grid size-10 place-items-center rounded-full border border-line text-ink-2 transition-colors hover:border-ink/30 hover:text-ink"
              aria-label="Lelam on LinkedIn (opens in new tab)"
            >
              <LinkedinGlyph className="size-4" />
            </a>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {FOOTER_GROUPS.map((g) => (
            <nav key={g.title} aria-label={g.title}>
              <p className="eyebrow mb-4">{g.title}</p>
              <ul className="space-y-2.5">
                {g.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-[0.92rem] text-ink-2 transition-colors hover:text-brand">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-3 py-6 text-[0.8rem] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} lelam.co. All rights reserved.</p>
          <p>Independent platform. Not affiliated with MSTC, BaankNet, GeM or any bank.</p>
        </div>
      </div>
    </footer>
  );
}
