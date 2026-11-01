import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/session";
import { MotionProvider } from "@/components/motion/motion-provider";
import { ToastProvider } from "@/components/ui/toast";
import { themeScript } from "@/components/theme";
import { SITE_URL } from "@/lib/site";

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });
const serif = Instrument_Serif({ variable: "--font-instrument-serif", subsets: ["latin"], weight: "400", style: ["italic", "normal"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Lelam: India's auction intelligence platform for MSTC & bank auctions",
    template: "%s | Lelam",
  },
  description:
    "Search MSTC e-auctions and bank property auctions in one place. Lelam reads catalogs, values every lot and works out landed cost, GST and ROI before you bid.",
  keywords: ["MSTC auction", "e-auction India", "scrap auction", "bank auction property", "SARFAESI auction", "BaankNet", "landed cost calculator"],
  applicationName: "Lelam",
  openGraph: { type: "website", siteName: "Lelam", locale: "en_IN", url: SITE_URL },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f5f0" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" suppressHydrationWarning className={`${sans.variable} ${mono.variable} ${serif.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Without JS, entrance animations never run: show their final state. */}
        <noscript>
          <style>{`[style*="opacity:0"],[style*="opacity: 0"]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
        <MotionProvider>
          <SessionProvider>
            <ToastProvider>{children}</ToastProvider>
          </SessionProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
