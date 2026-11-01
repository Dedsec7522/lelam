# Lelam rebuild: plan, inventory and architecture

Source research: `../LELAM_WEBSITE_ANALYSIS.md` (live study of lelam.co, 1 Nov 2026).

## 1. Route map (reference → rebuild)

| Reference route | Rebuild route | Notes |
|---|---|---|
| `/` | `/` | New hero, categories, recommendations, tools, intelligence, enterprise, FAQ |
| `/auctions` | `/auctions` | Plain-English search, filter drawer, 2–5 col + list views, sort, URL-synced filters |
| detail modal | `/auctions` modal + `/auctions/[id]` | Shareable URLs; the id is the Ref ID (fixes the reference 404) |
| `/news` | `/news` | |
| `/blog`, `/blog/:id` | `/blog`, `/blog/[slug]` | |
| `/faq` | `/faq` | Search + two tabs |
| `/pricing` | `/pricing` | Monthly/yearly, 4 plans, comparison table, FAQ |
| `/checkout` | `/checkout` | Auth required, coupons, GSTIN, pincode, trial, demo payment |
| `/about`, `/contact`, `/notices` | same | |
| `/quotes`, `/quote` | `/quotes` (+ redirect `/quote`) | Public Quote Builder page; the tool itself is `/dashboard/quotes` (Business plan) |
| `/terms`, `/privacy`, `/cookies` | same | |
| `/auth/login`, `register`, `forgot-password`, `reset-password` | same | `/login`, `/register` redirect |
| `/adminlogin` | redirect → `/auth/login?redirect=/admin` | |
| `/dashboard/*` (bids, interested, notifications, documents, profile, vendors, reminders, inventory, quotes, shipping-requests) | same | |
| `/seller`, `/seller/auctions`, `/seller/auctions/create`, `/seller/auctions/[id]/edit` | same | Role: seller/admin |
| `/logistics`, `/logistics/requests`, `/logistics/profile` | same | Role: logistics/admin |
| `/admin` | `/admin` | Role: admin |

## 2. Architecture

- **Next.js 16 App Router**, TypeScript strict, Tailwind v4, `motion/react`, lucide-react, zod, jose.
- `cacheComponents` is **off**. The app reads sessions and search params on many routes, and the "caching without Cache Components" model is simpler and fully supported. Marketing pages remain statically prerendered.
- **Layers**
  - `src/lib/*`: pure domain logic (search parsing, landed cost, ROI, geo, formatting, plan entitlements). Framework-free and unit-tested.
  - `src/server/*`: the data access layer (`server-only`): seed catalog, JSON-file store for mutable data, session/auth, repositories.
  - `src/app/api/*`: route handlers are the only write boundary. Every input is validated with zod.
  - `src/components/*`: UI primitives (`ui/`), motion primitives (`motion/`), layout, and feature components.
- **Auth**: email + password (scrypt hashes), signed JWT (HS256, jose) in an HttpOnly, SameSite=Lax, Secure-in-prod cookie. `proxy.ts` does optimistic redirects; every protected page and API re-checks the session in the DAL (defence in depth). Roles: buyer, seller, logistics, admin.
- **Storage**: `.data/db.json` (gitignored) behind a `Store` interface. It is replaceable with Postgres/Supabase without touching the UI.
- **Auction catalog**: deterministic seed data modelled on MSTC + BaankNet listings. There is no live MSTC feed (it needs scraping or partner access); this is documented.
- **Chat assistant**: `/api/chat`. Answers from the FAQ by retrieval, and optionally calls an OpenAI-compatible LLM **server-side** when `LLM_API_KEY` is set. No keys ever ship to the browser, which fixes the leaked key on the reference site.
- **Payments**: a demo-mode payment that activates the plan, clearly labelled. Razorpay keys plug into `src/server/payments.ts`.

## 3. Entitlements (from the reference pricing)

| Feature | Free | Individual | Business | Enterprise |
|---|---|---|---|---|
| Search, details, PDF/catalog, watchlist | ✓ (10) | ✓ (50) | ✓ (∞) | ✓ (∞) |
| Landed-cost estimator, reminders, document vault, inventory, logistics quotes | – | ✓ | ✓ | ✓ |
| Re-auction filter (PRO) | – | ✓ | ✓ | ✓ |
| Bid Intelligence, Quote Builder, recommendations++ | – | – | ✓ | ✓ |
| Seller portal | – | – | – | ✓ |

## 4. Testing strategy

- **Unit (Vitest)**: search parser, landed cost, ROI, geo distance, entitlements, validation schemas, formatting.
- **Integration (Vitest)**: route handlers (auth register/login, contact, watchlist) against a temp store.
- **Component (RTL)**: accordion, plan toggle, filter behaviour.
- **E2E (Playwright)**: home → auctions search → detail; register → dashboard; pricing → checkout gating; keyboard nav; mobile menu.
- **Gates**: `tsc --noEmit`, `eslint`, `next build`.
