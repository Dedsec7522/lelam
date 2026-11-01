import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { AuthShowcase } from "./showcase";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-ink text-paper lg:flex lg:flex-col" style={{ colorScheme: "dark" }}>
        <div className="bg-grid absolute inset-0 opacity-50 [mask-image:linear-gradient(160deg,black,transparent_80%)]" aria-hidden />
        <div className="relative flex flex-1 flex-col justify-between p-12">
          <Link href="/" className="inline-flex w-fit items-center gap-2 text-sm text-paper/70 hover:text-paper">
            <ArrowLeft className="size-4" aria-hidden /> Back to lelam.co
          </Link>
          <AuthShowcase />
          <p className="text-[0.8rem] text-paper/50">Independent platform. Not affiliated with MSTC, BaankNet, GeM or any bank.</p>
        </div>
      </aside>

      <main id="main" className="flex flex-col bg-paper">
        <div className="flex items-center justify-between p-5 lg:hidden">
          <Logo />
          <Link href="/" className="text-sm text-muted hover:text-ink">
            Home
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>
        <footer className="flex flex-wrap justify-center gap-x-5 gap-y-2 border-t border-line px-5 py-4 text-[0.78rem] text-muted">
          <span>© {new Date().getFullYear()} lelam.co</span>
          <Link href="/privacy" className="hover:text-ink">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-ink">
            Terms
          </Link>
          <Link href="/cookies" className="hover:text-ink">
            Cookies
          </Link>
          <Link href="/contact" className="hover:text-ink">
            Support
          </Link>
        </footer>
      </main>
    </div>
  );
}
