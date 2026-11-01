import type { Metadata } from "next";
import Link from "next/link";
import { SUPPORT } from "@/lib/site";
import { Accent } from "@/components/ui/primitives";
import { LegalLayout, type LegalSection } from "@/components/content/legal-layout";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "The small set of cookies and browser storage Lelam uses: an essential session cookie and a few preferences. No advertising or third-party tracking cookies.",
  alternates: { canonical: "/cookies" },
};

const STORAGE: { name: string; type: string; purpose: string; duration: string; category: string }[] = [
  { name: "lelam_session", type: "HttpOnly cookie", purpose: "Keeps you signed in. Signed and unreadable by page scripts.", duration: "7 days, or 30 days with “Keep me signed in”", category: "Essential" },
  { name: "lelam-cookie-consent", type: "Local storage", purpose: "Remembers your cookie choice so the banner does not reappear.", duration: "Until cleared", category: "Essential" },
  { name: "lelam-theme", type: "Local storage", purpose: "Remembers light, dark or system theme.", duration: "Until cleared", category: "Preference" },
  { name: "lelam-market-view", type: "Local storage", purpose: "Remembers grid or list view in the marketplace.", duration: "Until cleared", category: "Preference" },
];

const SECTIONS: LegalSection[] = [
  {
    id: "what",
    title: "What cookies are",
    body: (
      <p>
        Cookies are small text files a website stores in your browser. Similar technologies, such as local storage, keep small values on your device. We use both,
        sparingly, and this page lists every one.
      </p>
    ),
  },
  {
    id: "list",
    title: "What we store",
    body: (
      <div className="my-6 overflow-x-auto rounded-2xl border border-line" tabIndex={0} role="region" aria-label="Cookies and storage used by Lelam">
        <table className="!my-0 min-w-[640px]">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Type</th>
              <th scope="col">Purpose</th>
              <th scope="col">Duration</th>
              <th scope="col">Category</th>
            </tr>
          </thead>
          <tbody>
            {STORAGE.map((s) => (
              <tr key={s.name}>
                <th scope="row" className="!bg-transparent font-mono text-[0.85rem]">
                  {s.name}
                </th>
                <td>{s.type}</td>
                <td>{s.purpose}</td>
                <td>{s.duration}</td>
                <td>{s.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  },
  {
    id: "essential",
    title: "Essential and preference storage",
    body: (
      <>
        <p>
          <strong>Essential</strong> items are strictly necessary for the Service to work, for example to keep you signed in securely. They cannot be switched off
          in our banner, because the site would not function without them.
        </p>
        <p>
          <strong>Preference</strong> items remember choices you make, like theme and marketplace layout. They never leave your device and are not used to track
          you.
        </p>
      </>
    ),
  },
  {
    id: "no-tracking",
    title: "No advertising or third-party tracking",
    body: (
      <p>
        Lelam does not use advertising cookies, cross-site tracking pixels or third-party ad networks, and we do not sell data. If we ever add optional analytics,
        we will ask for your consent first and update this page before doing so.
      </p>
    ),
  },
  {
    id: "control",
    title: "Your choices",
    body: (
      <>
        <p>
          You can accept or decline non-essential storage in the cookie banner. You can also clear cookies and site data at any time in your browser settings;
          doing so signs you out and resets your preferences.
        </p>
        <p>
          Most browsers let you block cookies entirely. If you block the session cookie, you can still browse public pages but will not be able to sign in.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "Changes and contact",
    body: (
      <p>
        We will update this page whenever we change what we store. Questions: <a href={`mailto:${SUPPORT.email}`}>{SUPPORT.email}</a>. For how we handle
        personal data more broadly, see our <Link href="/privacy">Privacy Policy</Link>.
      </p>
    ),
  },
];

export default function CookiesPage() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title={
        <>
          Cookie <Accent>Policy</Accent>
        </>
      }
      intro="Lelam stores as little as possible in your browser: one essential session cookie and a few remembered preferences. No ads, no third-party trackers."
      sections={SECTIONS}
    />
  );
}
