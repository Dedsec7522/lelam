# lelam.co: Website Study & Analysis

*Studied live on 1 Nov 2026 (homepage, every public route, the auction detail modal, auth screens, and the production JS/CSS bundles).*

---

## 1. What the product is

**Lelam** ("lelam" means *auction* in Malayalam/Hindi) is an **independent eAuction intelligence platform for India**. It does **not** host bidding. It aggregates public auction catalogs and adds analysis on top of them:

| Source portal | What it covers |
|---|---|
| **MSTC** (Govt. of India, Ministry of Steel) | Scrap metal, forest produce/timber, end-of-life vehicles, plant & machinery, e-waste, minerals |
| **BaankNet** | SARFAESI / DRT / IBC bank-foreclosed properties and vehicles |
| **GeM** | Government tenders (covered mostly through blog content) |

**Tagline:** "Where auctions are mainstream"
**Positioning:** "Independent, third-party assistive platform… not affiliated with MSTC" (repeated in the FAQ, footer and auth footer).
**Origin story:** started in a small office in Trivandrum. The current office address is in Halasuru, Bangalore.
**Core value:** find auctions across scattered portals, read the PDF catalogs for you (OCR), then calculate **landed cost** (bid + EMD + GST/RCM + TCS + transport) and **projected ROI** before you bid on the official portal.

Users: scrap buyers, recyclers, traders, first-time bidders, enterprises. There are also **seller** and **logistics-partner** roles.

---

## 2. Tech stack (from the production bundle)

| Layer | Tech |
|---|---|
| Framework | **React SPA** built with **Vite** (Rolldown), code-split into about 90 lazy chunks |
| Routing | React Router (`createBrowserRouter`, nested layouts, `errorElement`, role guards) |
| Styling | **Tailwind CSS v4** (CSS variables, `@theme`), shadcn-style tokens (`--primary`, `--primary-foreground`) |
| UI kits | **Ant Design** (date pickers, selects in filters), **lucide-react** icons |
| Animation | **Framer Motion** (pricing, checkout, about, auctions), CSS keyframes, hand-written scroll-driven JS |
| 3D / WebGL | **Three.js**, for the hero "GLSL Hills" terrain and the chatbot's "Voice-Powered Orb" shader |
| Backend | **Supabase** (auth, Postgres, storage); services: auth, admin, audit, public, blog, auction, recommendation, marketPrice, logistics, storage |
| Data | React Query, a page-cache util, Zod validation |
| Payments | Razorpay-style flow ("Pay via Card, UPI or Net Banking", signature verification), coupons, GSTIN validation, pincode lookup |
| Celebration | `canvas-confetti` on checkout success |
| AI chat | "Laila Assistant": OpenRouter → `qwen/qwen-2.5-7b-instruct`, FAQ-based router, microphone/voice input |
| Domain logic | `nlpSearchUtils` (plain-English search), `mstcHelpers`, `metalValuationModels`, `currency` (₹ Indian grouping) |
| SEO | Per-route `<title>`, meta description and keywords, canonical, OG/Twitter tags, JSON-LD set by a custom `SEO` component |

**Design tokens**
- Font: **Inter** (`--font-sans`). The About page also uses **Archivo** (italic, heavy) for the big headline.
- Primary: **#2563EB** (blue-600), hover **#1D4ED8** (blue-700). The scale is Tailwind blue (50 `#eff6ff` … 300 `#93c5fd`).
- Neutrals: Tailwind **slate**. The hero runs `slate-950 → slate-900 → slate-950`. Sections alternate `bg-white` and `bg-slate-50/70` with `border-slate-200/60` hairlines.
- Radius: cards `rounded-xl/2xl`, CTA `rounded-2xl`, toggles `rounded-full`.
- Shadows: soft, plus coloured CTA shadows (`shadow-xl shadow-primary/30` → `hover:shadow-primary/60`).

---

## 3. Site map (all routes)

### Public (main layout with header and footer)
| URL | Page |
|---|---|
| `/` | Home (landing) |
| `/auctions` | Auctions Marketplace (catalog search) |
| `/auctions/:id` | Auction detail (uses an internal id, not the Ref ID; `/auctions/39606` 404s). In the listing, details open as a **modal** |
| `/news` | News & Updates (aggregated external news) |
| `/blog` | Blog / Knowledge Hub |
| `/blog/:slug` | Blog article |
| `/faq` | Help Center & FAQ |
| `/pricing` | Plans & Pricing |
| `/checkout` | Checkout (requires login; redirects to `/auth/login?redirect=%2Fcheckout`) |
| `/about` | About Us |
| `/contact` | Contact Us |
| `/notices` | Official Notices (currently "No official notices available") |
| `/quotes`, `/quote` | Quote Builder (paywalled: "Unlock Quote Builder → Upgrade to Business") |
| `/terms`, `/privacy`, `/cookies` | Legal |
| `/not-found` | Custom 404 card ("404 NOT FOUND · Page Not Found · Go Back / Go to Home") |

### Auth (split-screen AuthLayout, no header)
`/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password`, `/adminlogin`

### Buyer dashboard (`/dashboard`, protected)
`/dashboard` (overview) · `bids` (My Bids) · `interested` (Watchlist) · `notifications` · `documents` (Document Vault) · `profile` · `vendors` · `reminders` · `inventory` · `quotes` / `quote` · `shipping-requests`

### Seller portal (`/seller`, roles: seller/admin)
Seller dashboard · `auctions` (Manage Auctions) · `auctions/create` · `auctions/:id/edit`

### Logistics partner (`/logistics`)
Logistics dashboard · `requests` (shipping/quote requests) · `profile`

### Admin (`/admin`)
Admin panel with audit service

---

## 4. Global UI elements

### Header / Navbar
- `sticky top-0 z-40`, height 80px. Logo on the left (`/png_lelam_1.webp`, 38px tall). Links: **Home · Auctions · News · Blog · FAQ · Pricing · About · Contact**, then a blue **Sign In** button. A notification bell (with dropdown) shows when logged in.
- Active link: `text-primary-700 bg-primary-100` pill.
- Link hover: `bg-primary-100/70`, `-translate-y-0.5` lift, and a soft shadow.
- Desktop nav appears at `xl`. Below that there is a hamburger menu.
- **Transparent-to-glass behaviour on Home** (see Motion §6.2).

### Mobile bottom nav
A fixed bottom tab bar (`nav.fixed bottom…`) with Home, Auctions, Dashboard (or Login), News, and FAQ, each with an icon. It is hidden on `/auth/*`. On Home it only appears after `scrollY > 50`; on every other page it always shows.

### Footer
Links: Explore Auctions · MSTC Catalog · Market Trends (news) · FAQ · About Us · Contact Support · Terms & Conditions · Privacy Policy · Cookie Policy · `support@lelam.co` · LinkedIn · Dashboard.

### Cookie banner
A compact glass card in the bottom-left (`bg-white/95 backdrop-blur-xl`, `rounded-xl`, `shadow-2xl`). It appears **1 s after load** with `animate-fade-in`. Buttons: Decline / Accept All. The choice is stored as consent.

### Chat assistant: "Laila"
A floating **WebGL orb** in the bottom-right (Three.js shader that reacts to hover via `hover`/`hoverIntensity` uniforms and rotation). It opens a chat panel with a welcome message ("I'll help you with any queries related to MSTC and Lelam") and quick chips: *EMD Refund Policy · How Lelam Assists · Scrap price valuation · PCB documents submission*. It has mic voice input with an animated **wave-bar** visualiser and bouncing typing dots. Answers come from FAQ matching first, with an LLM (Qwen 2.5 7B via OpenRouter) as fallback.

---

## 5. Page-by-page breakdown

### 5.1 Home `/`
1. **Hero** (full viewport, dark navy gradient)
   - Animated 3D **wireframe terrain ("GLSL Hills")** behind everything.
   - Text stack: "INTRODUCING" (wide letter-spacing `0.55em`, light weight), **white lelam.co logo** (PNG inverted with `brightness(0) invert(1)`), then "WHERE AUCTIONS ARE MAINSTREAM" (tracking `0.35em`).
   - CTA: **Explore Auctions →** (blue, `rounded-2xl`, glowing shadow, arrow nudges right on hover).
   - At the very top only a hamburger shows; the full navbar slides in on scroll.
2. **Explore by Category**: a 3×2 grid of cards (icon tile, "N+ Listings" pill, title, description, "Browse Category →"):
   Scrap & Material (1300+) · Plant & Machinery (500+) · Vehicles & Fleet (2000+) · Commercial Real Estate (400+) · E-Waste & Electronics (400+) · Minerals & Ores (100+). Then a **View All Marketplace Categories** button.
3. **Recommended Auctions**: a horizontal row of auction cards. For logged-out users the cards are skeleton/blurred, with a centred dark **"Unlock Recommended Auctions"** lock card (Sign Up Now / Sign in now).
4. **Built-In Tools & Features**: six feature cards, each with three bullet chips and "Explore Feature":
   ROI Calculator · Quote Builder · Document Vault · Watchlist & Alerts · AI Market Valuation (LME index blending) · MSTC Catalog Aggregator (10,000+ catalogs, PDF OCR).
5. **News & Market Intelligence**: two featured blog cards and two "Latest Market Bulletins" news cards, with "View All Blogs | View All News".
6. **Enterprise & B2B Solutions**: a dark `slate-900` section. On the left: the pitch plus three benefit rows (Dedicated MSTC Catalog Specialist · Bulk Lot Analytics & Alerts via SMS/Email/WhatsApp · Priority Business Support) and contacts. On the right: a **Contact Sales** form (Name, Work Email, Phone, Company, Requirements) saying "an advisor will reach out within 2 hours".
7. **FAQ**: an accordion preview.
8. Footer.

All home sections below the hero are **lazy-loaded chunks** (`ServiceCategoriesSection`, `FeaturedAuctionsSection`, `HowItWorksSection`, `LatestNewsBlogSection`, `FaqSection`, `ContactSalesSection`).

### 5.2 Auctions Marketplace `/auctions`
- **Hero band**: navy gradient, "Auctions Marketplace" plus subtitle, and a large white search pill with a blue **Search** button.
- **Typewriter placeholder** cycles through example queries: *Find auctions within 200km · Show me auctions in Delhi · Auctions near me · Show me vehicle auctions · Copper scrap auctions in Mumbai · Iron and steel scrap near Kolkata…* (plain-English/NLP search). Typing the word "me" offers a **"Find auctions within 200km (using my location)"** suggestion that uses geolocation.
- **Filter drawer** (opened from a blue tab on the left edge or the "Show Filters" button):
  Category → Sub-category · Asset attachments (Docs / Images) · Auction type (**Re-auction Only**, a PRO feature) · Regional office · Nearby (200 km of me) · Location · Pre-bid requirement · Date range (from/to) · Reset / Apply.
- **Toolbar**: "Showing 10,608 Government Catalogs", a column switcher (**2 / 3 / 4 / 5 Col**), and a grid/list toggle.
- **Skeleton cards** (pulse) show while loading.
- **MSTC auction card**: catalog thumbnail, Ref ID (copy button), badges (ASSET DOCS AVAILABLE, IMAGES AVAILABLE), category (e.g. FOREST PRODUCE / METAL / TRANSPORT VEHICLES), title, an info grid (Office, Location, EMD Required, Pre-bid EMD, Auction Type such as O-General, F-Forest, U-Price), bidding period, inspection period, a live **countdown status** ("Starts in 0d 19h" / "Bidding Started"), and the buttons **View Details** and **I'm Interested** (heart).
- **BaankNet property card** variant: Reserve price, "No Reserve Price", Auction Framework (SARFAESI / DRT / IBC), Public Sector Bank, "Notice PDF Available", and "Open listing on official BaankNet website".

### 5.3 Auction Detail (modal and `/auctions/:id`)
A large rounded modal with two panes:
- **Left: tabs "Catalog Details" | "Bid Intelligence (BETA)"**
  - Category/item type and title. The official MSTC reference number has a **Copy Ref Number** button.
  - Info tiles: Seller, Regional office, Location/State, Auction type, Bid opening/closing time, Inspection window, Status countdown.
  - **Identified Inventory & Materials** table ("16 lots identified"): Lot · Material description · Quantity (e.g. 0.37 CUM) · **Market price** (green, e.g. ₹46,000/CUM) · **Add** (to a quote). There is also a **Build a Quote** button.
  - **Compliance & documents** checklist: MSTC buyer registration, PAN, Forest Transit Pass (CONDITIONAL).
  - **Financial terms**: EMD, Pre-bid EMD, GST scheme (**RCM**, with an explanation).
  - **Market Analysis & ROI**: Projected turnover, Predicted closing bid, Projected profit, **Projected ROI (+33.3%)**.
  - **Key contact personnel**: MSTC officers with email and phone.
  - The Bid Intelligence tab is paywalled with an "Unlock Bid Intelligence & AI Valuation" upsell listing AI Valuation Engine, Smart Bid Recommendations (walk-away / conservative / aggressive caps), Market Price History charts, and Logistics & Quotes. CTA: **Upgrade to Bidder Pro**.
- **Right: Catalog Document Preview** (rendered PDF page with a page count). Footer buttons: **View Catalog** and **Download PDF Catalog**.

### 5.4 Pricing `/pricing`
- Headline "Plans & Pricing" revealed word by word (**VerticalCutReveal**).
- **Monthly / Yearly (Save 12%)** pill toggle with a sliding spring highlight.
- Four plan columns:
  - **Free** (₹0): search, details and PDFs, basic prices, email reminders, keyword alerts.
  - **Individual ₹799/mo**: GST/Tax/Transport estimator, basic Max-Bid calculator, reminders, document vault, inventory, logistics quotes, 24h support.
  - **Business ₹1,499/mo** (*Popular*, dark highlighted card): AI win-probability, P&L valuation, scrap vs resale, risk warnings, live rates and history, trend forecasts, plain-English search, international price comparison, competitor bid history, re-auctioned lots. **30-day free trial**.
  - **Enterprise (Custom)**: What-If simulator, top-bid suggestions, custom indices, seller portal, SSO, account manager, custom API and dedicated server.
- A detailed **comparison table** grouped as Discovery & Search, Valuation & Pricing, Security & Support, Dashboard & Tools (watchlist 10 / 50 / ∞ / ∞), Logistics & Operations, and Team (seats: none / none / 5 / 10).
- A CTA band ("Ready to win your next auction?") with **Start Free (No Credit Card)** and **Talk to Sales**.
- A pricing FAQ accordion that expands with a height animation.

### 5.5 Checkout `/checkout` (auth required)
Plan summary, billing details (GSTIN validation, pincode → city/state autofill), coupon codes (percentage discount), free-trial activation (blocked if already claimed), and Card/UPI/Net-Banking payment with signature verification. Motion includes a fade-in page, a progress bar (`width 0 → 100%` over 3 s), scale-in cards, collapsible sections, a green price "pop" when a coupon applies, and **confetti on success**.

### 5.6 News `/news`
"News & Updates" header with an icon tile, then a 3-column grid of news cards (thumbnail, date, title, excerpt, "Read article →"). Content is aggregated from external sources (BigMint, LiveLaw, Saur Energy…) and links out.

### 5.7 Blog `/blog` and `/blog/:slug`
- "KNOWLEDGE HUB" pill, then "eAuction Insights & Market Intelligence".
- A **Featured** large horizontal card (image left, meta and excerpt right), then a "Latest Articles" grid.
- Current articles: *What is MSTC? (Complete Guide 2026)* · *How to Buy Seized & Unclaimed Vehicles via MSTC* · *The Real Cost of Winning an MSTC Auction: EMD, GST (RCM) & Penalties* · *Why Finding Auctions in India Is Difficult* · *GeM Bid Eligibility Explained*. Authors: Anshaj Shaji and Adithyan S M.
- **Article page**: full-width dark image hero with "← Back to all blogs", date and author, a big white title, then the article body (HTML parsed from a CMS by `blogHtmlParser`).
- Card hover: image `scale-105`, title turns primary, arrow `translate-x-1`.

### 5.8 FAQ `/faq`
Help-centre layout: a centred icon, "MSTC & eAuctions Help & FAQ", a **search box**, a segmented toggle (**MSTC eAuctions | Lelam Platform**), and accordion cards with chevron buttons. Topics include how bidding works, affiliation, missing photos, Pre-bid EMD refunds, EMD not credited, night-time extensions, PCB documents for e-waste, and more.

### 5.9 About `/about`
- Giant headline **"We are, lelam.co"**. "We are," is set in heavy italic Archivo in slate-900 and "lelam.co" in blue. Each word slides up from a clipped mask.
- Two-column editorial layout. Left: a large pull quote ("We didn't come from finance…"), a question block with a blue left border, then **Vision** and **Mission**. Right: a long narrative paragraph and a callout card ("Experienced bidders know where to look. Most others don't. That's why we built lelam.co").

### 5.10 Contact `/contact`
"Contact Us" heading. Left info card: Office (Halasuru, Bangalore 560008), Phone (+91 94477 53889, Mon–Sat 9–6 IST), Email (Support@ / Business@lelam.co). Right form: Name, Email, **Issue Type** (Payment failed, Payment & EMD, Subscription & Billing, Bidding help, Account access, Catalog issue, Bug report, General), Subject, Message, and **Send Message ✈**.

### 5.11 Auth (`/auth/login`, `/auth/register`, …)
Split screen. **Left half**: dark navy gradient with the white logo and "Everything you need in a single platform.", plus slide-indicator dots at the bottom (a rotating carousel). **Right half**: a white form.
- Login: email, password (show/hide eye), "Keep me signed in for 30 days", Forgot password, **Sign in**, "OR CONTINUE WITH" **Google**, and a "Create an account" link.
- Register: first and last name, email, password, confirm password, a Terms checkbox, Create Account, and Google.
- Footer strip: "© 2026 lelam.co · Not affiliated with MSTC · Privacy · Terms · Cookies · Support".

### 5.12 Gated pages
`/quotes` shows an "Unlock Quote Builder" upsell (create commercial quotes, margins, branding, PDF to logistics vendors) with **Upgrade to Business**. Recommended auctions and Bid Intelligence are gated the same way.

---

## 6. Animation & motion system (key to recreate the feel)

The motion language is **calm, premium, and performance-conscious**: scroll-linked fades, subtle lifts, spring toggles, and one hero WebGL scene. There is no smooth-scroll library such as Lenis; the site uses native scrolling.

### 6.1 Hero "GLSL Hills" (Three.js)
- A `PlaneGeometry(256, 256, 192 seg)` (64 segments on mobile) rotated 90° on X so it lies flat as a floor.
- **Vertex shader**: classic **3D Perlin noise (`cnoise`)** in three octaves (frequencies 0.08, 0.06, 0.4). The noise position scrolls along Z with `time * -30`, so the terrain **flows toward the viewer forever**. Height is shaped by `sin1 = sin(x/128 · 90°)`, which raises the left and right edges (+`sin1² · 40`) and forms a **valley/canyon** with the centre lower.
- **Fragment shader**: colour `vec3(0.5, 0.7, 1.0)` (pale blue). Opacity is `(96 − distance) / 256`, so the terrain fades out with distance and you get a soft glowing horizon. It renders as **dense point/line texture** on a transparent canvas.
- Camera: perspective FOV 45 at `(0, 16, 125)` looking at `(0, 28, 0)`. Responsive: FOV 54 or 62 on narrower aspect ratios.
- **Performance**: frame-capped at **30 fps** (24 on mobile), DPR capped at 1.5 (1 on mobile), paused via IntersectionObserver when off-screen, ResizeObserver for sizing, `antialias: false`.
- **Deferred mount**: the WebGL chunk only loads after the **first user interaction** (pointerdown, scroll, or touch) or **after 2.5 s**, which keeps LCP fast.
- Canvas wrapper opacity is `0.75 × (1 − progress)`, so it fades as you scroll.

### 6.2 Hero scroll-driven exit (custom rAF, not Framer)
`progress = clamp(scrollY / (heroHeight × 0.7), 0, 1)`, throttled with `requestAnimationFrame`. Each element exits at its own rate, which gives a **parallax-dissolve**:

| Element | Opacity | Transform |
|---|---|---|
| "INTRODUCING" | `1 − p·1.5` | `translateY(−40p px)` |
| Logo | `max(0, 1 − p·1.5)` | `scale(1 − 0.15p) translateY(−ease(p)·80px)` with **easeInOutQuad** `p<.5 ? 2p² : 1−(−2p+2)²/2`, plus a 0.05 s linear smoothing transition |
| Tagline | `1 − p·1.3` | `translateY(−30p px)` |
| CTA | `1 − p·1.5` | `translateY(−20p px)` |
| Hills canvas | `0.75(1 − p)` | none |

The hero dispatches `hero-scroll-progress` and `hero-mount` **CustomEvents** so the header can react.

### 6.3 Header reveal on Home
- While on Home at `scrollY ≤ 2` the header is **transparent**: logo hidden (`opacity 0, translateY −8px`), white nav text, no border or shadow.
- Once you scroll, a white glass layer (`bg-white/95 backdrop-blur-md`) **slides down** from `-translate-y-full` to `translate-y-0` (**500 ms ease-out**). The logo fades and drops in (250 ms), a hairline border plus `0 1px 4px rgba(0,0,0,.04)` shadow appears, and the nav text switches to slate.
- On every other page the header is always in the solid state.

### 6.4 Micro-interactions (Tailwind transitions, 200–300 ms)
- **Category cards**: `hover:-translate-y-1`, `hover:shadow-xl`, `hover:border-primary/40`. The icon tile changes from tinted to **solid primary with a white icon** and `scale-110`. The title turns blue, a hidden ↗ arrow fades and slides in (`opacity 0 → 100`, `translate-x`), and the "Browse Category →" arrow nudges `translate-x-1`.
- **Buttons**: lift `-translate-y-0.5`, darken (`primary-700`), coloured glow shadow intensifies (`shadow-primary/30 → /60`), and the trailing arrow slides right.
- **Blog/news cards**: image zoom `scale-105`, `shadow-xl`, primary border.
- **Nav links**: pill background fade and a 2px lift.
- **FAQ accordion**: card border turns `primary/30` on hover, the chevron rotates, and the body expands.

### 6.5 Framer Motion usages
- **Pricing headline, `VerticalCutReveal`**: splits by words (Intl.Segmenter aware). Each word springs up from below a clip mask (`spring stiffness 190, damping 22`, stagger 0.2 s).
- **Monthly/Yearly toggle**: a shared `layoutId="switch"` pill slides between options (`spring stiffness 500, damping 30`) with a blue gradient and ring.
- **Plan cards**: staggered entrance (`delay: i × 0.3–0.5 s, duration 0.5`) on scroll into view, and a spring (`stiffness 250, damping 40`).
- **Accordions / expanders**: `height 0 → auto`, `opacity 0 → 1`, `marginTop 0 → 16`, 0.3 s easeInOut (AnimatePresence exit mirrors it).
- **Checkout**: fade-in, scale-in cards (`0.95 → 1`), a 3 s progress bar, collapsible sections (0.35 s easeOut), a coupon price pop (`scale 1.3`, green), and confetti.

### 6.6 CSS keyframes in the global stylesheet
| Name | Effect | Used for |
|---|---|---|
| `fadeIn` | opacity 0→1, **0.2 s cubic-bezier(.16,1,.3,1)** (expo-out) | cookie banner, modals, toasts |
| `scaleUp` | 0.95→1 + fade, 0.25 s expo-out | modals and popovers |
| `slideDownFromTop` | −100% → 0 | dropdowns/banners |
| `slideInRight` | translateX 100% → 0, 0.3 s expo-out | side drawers (notifications, mobile menu) |
| `blink` | 1 s step-end | **typewriter caret** in the auction search |
| `bounce-once` | 1 → 1.25 → 0.9 → 1.1 → 1 (0.4 s) | heart / "I'm Interested" and counters |
| `marquee` | translateX 0 → −50%, 30 s linear infinite | logo/ticker strips |
| `fall-down` | fall 115vh with a 360° spin | **falling gavel** decorative animation |
| `spin-slow` | 5 s rotation | decorative icons |
| `pulse` / `ping` / `spin` / `bounce` | Tailwind defaults | skeleton loaders, live-status dots, spinners, chat typing dots |

**About-page-only keyframes** (inline `<style>`):
- `slide-up-word`: `translateY(110%) → 0` with fade, inside an `overflow-hidden` span (masked text reveal), staggered by `animationDelay` (100 ms…).
- `draw-stripe`: `scaleX(0 → 1)`, an underline/stripe drawing in.
- `slide-in-right`: `translateX(100px) → 0` with fade, for the right column and callout.

### 6.7 Other motion
- **Typewriter search** (Auctions): types at 70 ms/char, pauses 2.2 s, deletes at 25 ms/char, then moves to the next phrase, with a blinking caret.
- **Live countdowns** on every auction card and modal ("Starts in 19h 10m").
- **Skeleton shimmer** (`animate-pulse`) on the auction grid while data loads.
- **Chat orb**: a WebGL shader that rotates continuously and intensifies on hover. The mic visualiser uses `wave-bar` bars.
- **Auth carousel**: slide dots on the left brand panel.

---

## 7. User flows

1. **Discover**: Home hero → *Explore Auctions* → Marketplace → natural-language search or filters → card grid.
2. **Evaluate**: *View Details* → modal → lot table with market prices → ROI block → PDF catalog preview → *Build a Quote* / *Download PDF*.
3. **Track**: *I'm Interested* (requires login) → Watchlist (`/dashboard/interested`) → reminders and notifications.
4. **Upgrade**: a paywalled feature (Bid Intelligence, Quote Builder, Recommendations, Re-auction filter) → Pricing → Checkout (login redirect with `?redirect=`) → payment → confetti → dashboard.
5. **Act**: bid on the **official MSTC/BaankNet portal** (Lelam links out). Lelam never handles EMD or bids.
6. **B2B**: Enterprise section / Contact Sales form → 2-hour callback promise.
7. **Ecosystem**: sellers list auctions (`/seller`) and logistics partners answer shipping-quote requests (`/logistics`).

---

## 8. Observations & issues spotted

- **⚠️ Security: an API key is exposed in client JS.** The chatbot chunk (`/assets/Chatbox-*.js`) contains a hard-coded `Bearer sk-or-v1-…` **OpenRouter key**. Anyone can extract it and run up charges. It should be revoked and the LLM call moved behind a server or edge function (for example a Supabase Edge Function).
- `/auctions/<RefID>` returns 404. The detail route uses an internal id, so Ref IDs are not shareable as URLs.
- Home "Recommended Auctions" shows placeholder data (Ref IDs 11111, 22222…) behind the login gate.
- Home Contact Sales lists a placeholder phone number (+91 98765 43210), while the Contact page shows +91 94477 53889.
- Typos and polish: "independant" (About), "Not a Auto Pre-bid EMD Auction", and "Trusted by millions" on Pricing (an unlikely claim).
- The initial HTML is an SPA shell with no SSR, so the page text is invisible until JS runs (an SEO risk despite the meta tags). Blog articles would benefit from prerendering.
- Good performance hygiene: lazy route chunks, a deferred WebGL hero, fps caps, and off-screen pausing.

---

## 9. Quick recreation cheat-sheet

- **Palette**: slate-950 `#020617`, slate-900 `#0f172a`, slate-50 `#f8fafc`, primary `#2563eb` / hover `#1d4ed8`, accent tint `#dbeafe`, success green for prices.
- **Type**: Inter (UI). Hero uses wide-tracked uppercase light text (`tracking-[0.55em]`). The About display face is Archivo Black Italic.
- **Easing**: `cubic-bezier(.16,1,.3,1)` for UI enter animations, springs (190/22 and 500/30) for Framer elements, and easeInOutQuad for the hero logo.
- **Durations**: 200 ms (hover), 300 ms (cards), 500 ms (header glass slide).
- **Signature moments**: (1) the WebGL Perlin-noise canyon flowing toward the camera, (2) the hero dissolving on scroll at different rates per element, (3) the glass navbar sliding down, (4) the typewriter search, (5) masked word-reveal headlines, (6) cards that lift and fill their icon tile with primary blue.
