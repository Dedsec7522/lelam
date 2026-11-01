# Lelam: auction intelligence for India (rebuild)

An original, production-oriented rebuild of [lelam.co](https://www.lelam.co): one search across MSTC e-auctions and bank property auctions, with lot-level valuation, landed cost (GST/RCM, TCS, transport, loading), Bid Intelligence, and a full buyer, seller, logistics and admin workspace.

The functionality and information architecture follow the reference site (research: [`docs/research.md`](docs/research.md)). The visual design, copy, artwork, logo and motion are new. Architecture and the route map: [`docs/PLAN.md`](docs/PLAN.md).

## Live demo

**https://dedsec7522.github.io/lelam/** is a static preview built by `.github/workflows/pages.yml` on every push to `main` (and daily, so auction dates stay current).

GitHub Pages has no server, so the Pages build (`scripts/prepare-pages.mjs`, `STATIC_EXPORT=1`, `NEXT_PUBLIC_STATIC_DEMO=1`):
- **works fully:** home, marketplace search and filters (computed in the browser, including near-me), all 168 auction pages, pricing, blog, news, FAQ, legal pages, theme switching, and the assistant (FAQ answers in the browser);
- **shows a "static demo" notice:** sign-in, dashboards, seller/logistics/admin portals and checkout;
- **explains instead of sending:** contact, sales and newsletter forms.

For every feature, run it locally or deploy the normal build to a Node host (below).

## Run it

```bash
npm install
```

```bash
cp .env.example .env.local   # optional in dev; AUTH_SECRET is required in production
```

```bash
npm run dev                  # http://localhost:3000
```

```bash
npm run seed:demo            # buyer / seller / logistics / admin demo accounts → .data/demo-credentials.txt
```

Quality gates:

```bash
npm run typecheck && npm run lint && npm test
```

```bash
npx playwright install chromium && npm run e2e
```

```bash
npm run build && npm start
```

### Deploy

- **Node host (VM, Docker, Render, Railway):** `npm run build && npm start`. Set `AUTH_SECRET` and `NEXT_PUBLIC_SITE_URL`. The JSON store (`.data/`) needs a persistent disk, so use a volume or switch to a database (below).
- **Vercel or another serverless host:** the filesystem is ephemeral. Implement the `read`/`write` functions in `src/server/store.ts` against Postgres (for example Supabase or Neon) before going live. Every other layer already goes through that interface.
- Set `PAYMENTS_MODE`, `RESEND_API_KEY` and the `LLM_*` variables as needed (see `.env.example`).

## Stack

Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict), Tailwind CSS v4, Motion for React (`motion/react`), lucide-react, zod, jose. Vitest with Testing Library, and Playwright. `cacheComponents` is off by design (see PLAN §2). Marketing pages prerender statically; home, about and the sitemap use ISR at 30–60 minutes.

## Feature parity checklist

| Reference feature | Status | Where |
|---|---|---|
| Landing page: hero, categories, recommendations, tools, news & blog, enterprise form, FAQ | ✅ Rebuilt with an original design | `app/(site)/page.tsx` |
| Sticky header and mobile navigation | ✅ Plus mega menus, a ⌘K plain-English palette, a full-screen mobile menu and a bottom tab bar | `components/layout/*` |
| Auction marketplace: search, filter drawer, 2–5 column views, skeletons | ✅ URL-synced filters, plain-English parsing with "understood as" chips, sort, pagination, grid/list | `app/(site)/auctions`, `components/auctions/*` |
| Typewriter search prompts | ✅ Respects reduced motion | `components/home/hero.tsx` |
| Near-me (200 km) search | ✅ Location only on request, sent in the POST body (never in the URL), adjustable radius | `marketplace.tsx`, `api/auctions/search` |
| Re-auction-only filter (PRO) | ✅ Plan-gated on the server | `server/auction-query.ts` |
| Auction detail modal | ✅ Quick view, plus a **shareable `/auctions/[id]` page** (on the reference, Ref-ID URLs returned 404) | `auction-detail.tsx` |
| Lot table with market prices, compliance, financial terms, contacts | ✅ | same |
| Market analysis and ROI | ✅ | `lib/costing.ts` |
| Bid Intelligence (BETA) behind a paywall | ✅ Real server-gated API: bid caps, win probability, warnings | `api/auctions/[id]/intelligence` |
| Landed-cost / ROI calculator | ✅ Interactive (public demo on home, gated per lot) | `landed-cost-demo.tsx` |
| "I'm interested" watchlist | ✅ Optimistic toggle, enforced plan limits | `api/watchlist` |
| Build a quote / Quote Builder | ✅ Prefilled from a lot, margin and GST, print-to-PDF | `dashboard/quotes/*` |
| Document vault | ✅ PDF/PNG/JPG upload (5 MB, magic-byte checked), expiry badges | `dashboard/documents` |
| Reminders, inventory, vendors, my bids, notifications, profile and alerts | ✅ Full CRUD | `dashboard/*` |
| Logistics quote requests and partner portal | ✅ | `dashboard/shipping-requests`, `logistics/*` |
| Seller portal: create and edit listings | ✅ Listings go to pending until an admin approves | `seller/*` |
| Admin | ✅ Users (role/plan), leads, listing approval, audit log | `admin` |
| Pricing: monthly/yearly toggle, 4 plans, comparison table, FAQ | ✅ | `pricing` |
| Checkout: GSTIN, PIN→state, coupons, 30-day trial, success celebration | ✅ **Demo payment mode** (see limitations) | `checkout`, `api/checkout` |
| Auth: login, register, forgot and reset password, "keep me signed in" | ✅ scrypt, signed HttpOnly cookie, rate limits, session revocation | `app/auth/*`, `api/auth/*` |
| Google sign-in | ⚠️ Not implemented: needs OAuth client credentials | — |
| News, blog and blog detail | ✅ Blog with original articles. News is a built-in bulletin (see limitations) | `news`, `blog` |
| FAQ / help centre with search and tabs | ✅ Deep links (`/faq#id`) | `faq` |
| About, contact (support and sales), notices, terms, privacy, cookies | ✅ Legal pages are templates for counsel review | — |
| Cookie consent | ✅ Essential-only by default | `cookie-banner.tsx` |
| AI chat assistant ("Laila") | ✅ "Ask Lelam": FAQ-grounded, optional LLM **server-side only** (the reference leaked its API key in client JS) | `chat-widget.tsx`, `api/chat` |
| Voice input on the chat | ❌ Not built (low value; text only) | — |
| Dark mode | ✅ New (the reference had none) | `theme.tsx` |
| SEO | ✅ Per-page metadata and canonicals, JSON-LD (Organization, WebSite, Event, Article, FAQPage), sitemap, robots, OG image | — |

## How the three skill systems were used

**ECC (engineering):** Read `motion-foundations` and applied its token and spring rules. Used the `ecc:security-reviewer` and `ecc:react-reviewer` agents for independent reviews; all HIGH and MEDIUM findings were fixed and re-tested (below). The GateGuard hooks enforced the fact checks on every new file. Workflow: research → plan (`docs/PLAN.md`) → design system → build (with two parallel build agents for the workspace and content slices) → tests → review → fixes → re-verify.

**UI UX Pro Max (design):** Generated the design system for a "B2B auction marketplace analytics SaaS", then searched palettes and typography. Decisions:
- **"Ledger" identity:** warm paper surfaces, ink type and a Swiss 56px grid, departing from the reference's blue and slate. The brand colour is signal teal `#0F6E5B` (AA on white) with a copper `#B4501A` auction accent, plus semantic positive/warning/danger tokens. Full light and dark token sets.
- **Typography:** Geist Sans for UI and display (tight tracking), Geist Mono for figures and labels, and Instrument Serif italic for single editorial accent words.
- Pre-delivery checklist applied: SVG icons only, visible focus rings, 44px targets, AA contrast, `prefers-reduced-motion`, no horizontal scroll at 375px (checked).

**Motion (`motion/react`):** One token module (`lib/motion.ts`) holds durations, easings, distances, staggers and springs. Built on it:
- Masked word-reveal headlines and staggered scroll reveals
- Hero parallax (`useScroll`/`useTransform`) and an animated "lot ledger" (staggered rows, a stacked cost bar drawn with `scaleX`, count-ups)
- Drifting contour backdrop and a scroll-drawn process line
- Shared-layout active indicators in the nav, tab bar and segmented controls
- Mega-menu and dropdown springs, a circular clip-path mobile menu
- `AnimatePresence` for dialogs, drawers, toasts and form errors; grid-rows accordions; route transitions that skip the first SSR paint
- Price rolls on the billing toggle, an animated checkout success burst, and a hide-on-scroll compact header

Every component checks `useReducedMotion`, and a global CSS fallback plus a `<noscript>` rule keep content visible without JavaScript.

## Test and build results (run on 1 Nov 2026)

| Check | Result |
|---|---|
| `tsc --noEmit` | ✅ 0 errors |
| `eslint .` (Next + React 19 hooks rules) | ✅ 0 errors, 0 warnings |
| Vitest: unit tests (search parser, costing, billing, entitlements, validation, formatting) and integration tests (real route handlers against a temporary store: auth, CSRF origin check, watchlist limits, plan gating, trial-once, leads and honeypot, near-me search, coupons, plan lapse, session revocation) | ✅ 40/40 |
| Playwright: search → chips → quick view; shareable detail; protected redirect; register → trial → Bid Intelligence and dashboard; inline validation; keyboard (skip link, ⌘K); mobile menu and no-overflow; one `<h1>` on 10 content pages | ✅ 8/8 |
| `next build` (production) | ✅ Succeeds with no warnings |
| Security review (ECC agent) | 2 HIGH and 3 MEDIUM found → **all fixed**: plan expiry enforced, unverified "live" payments refused, spoof-resistant client IP and per-account login limit, sessions revoked on password change/reset, coupon endpoint throttled; uploads served with a sandbox CSP |
| React and accessibility review (ECC agent) | 2 HIGH and 7 MEDIUM found → **all fixed**: modal focus stability, near-me error handling and stale results, touch-safe mega menu, double-submit guard, checkout plan default, focus trap and restore on palette and mobile menu, disclosure semantics for the account menu, radio-group semantics for non-tab segmented controls |

Not run: a Lighthouse/Core Web Vitals audit, screen-reader testing on real devices, and cross-browser runs beyond Chromium.

## Limitations and external dependencies

- **Auction data is a seeded catalog** (168 lots per day, deterministic) modelled on MSTC and BaankNet listings. A live feed needs portal partnership or catalog scraping and OCR; plug it in at `CatalogSource` in `src/server/catalog.ts`.
- **Payments:** demo mode only. Razorpay order creation and signature/webhook verification are not wired; `PAYMENTS_MODE=live` deliberately refuses paid upgrades until they are. The Business trial works in every mode.
- **Storage:** a JSON file, which suits a single instance only. Use Postgres in production. The in-memory rate limiter is per instance; use Redis/Upstash when running more than one.
- **Email:** sent through Resend when `RESEND_API_KEY` is set; otherwise it is logged in development. Reminder delivery by email, SMS or WhatsApp is stored but not sent (it needs a scheduler and providers).
- **News:** a built-in bulletin of platform updates and explainers. Third-party news needs a licensed feed.
- **Not built:** Google OAuth (needs credentials), chat voice input, true PDF generation (the quote export uses the browser's print dialog), and a Postgres adapter.
- **Legal pages** are templates and need review by counsel.
- **Local data:** `.data/` holds dev accounts, including test accounts created during automated testing (`e2e+…`, `probe…`, `smoke+…@example.test`) and one test upload. Delete `.data/` for a clean store.
