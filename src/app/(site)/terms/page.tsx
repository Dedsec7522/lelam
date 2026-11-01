import type { Metadata } from "next";
import Link from "next/link";
import { SUPPORT } from "@/lib/site";
import { Accent } from "@/components/ui/primitives";
import { LegalLayout, type LegalSection } from "@/components/content/legal-layout";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of Lelam, an independent auction-intelligence platform: accounts, subscriptions, refunds, acceptable use and liability.",
  alternates: { canonical: "/terms" },
};

const mail = (
  <a href={`mailto:${SUPPORT.email}`}>{SUPPORT.email}</a>
);

const SECTIONS: LegalSection[] = [
  {
    id: "agreement",
    title: "About these terms",
    body: (
      <>
        <p>
          These Terms of Service (&ldquo;Terms&rdquo;) form an agreement between you and Lelam (&ldquo;Lelam&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), the
          operator of the website lelam.co and its related services (the &ldquo;Service&rdquo;). By creating an account or using the Service you agree to these
          Terms. If you use the Service for a business, you confirm you are authorised to accept these Terms on its behalf.
        </p>
        <p>
          Our <Link href="/privacy">Privacy Policy</Link> and <Link href="/cookies">Cookie Policy</Link> explain how we handle personal data and form part of
          these Terms.
        </p>
      </>
    ),
  },
  {
    id: "independence",
    title: "Independence and what Lelam is not",
    body: (
      <>
        <p>
          Lelam is an independent research and analysis platform. We are <strong>not affiliated with, authorised by or endorsed by</strong> MSTC Limited,
          BaankNet, the Government e-Marketplace (GeM), any bank, asset reconstruction company, insolvency professional or government department. Names of
          portals and sellers are used only to identify the source of publicly available information.
        </p>
        <ul>
          <li>
            <strong>We do not run auctions and do not bid on your behalf.</strong> All bids are placed by you, on the official portal that conducts the sale.
          </li>
          <li>
            <strong>We do not collect, hold or refund Earnest Money Deposits (EMD)</strong> or any sale consideration. Those payments are made to and refunded by
            the portal or seller under their terms. If anyone asks you to pay EMD to a Lelam account, do not pay, and report it to {mail}.
          </li>
          <li>We are not a party to any contract of sale between you and a seller.</li>
        </ul>
      </>
    ),
  },
  {
    id: "information",
    title: "Listings, valuations and indicative figures",
    body: (
      <>
        <p>
          Listings are compiled from public sources and may be incomplete, delayed or inaccurate. Valuations, landed-cost estimates, win probabilities, bid
          ranges, market prices and other analytics are <strong>indicative decision support only</strong>. They are not an offer, a guarantee of outcome, or
          financial, legal or tax advice.
        </p>
        <p>
          Before bidding, you must verify quantities, condition, terms, deadlines and eligibility in the official catalog and its Special Terms &amp; Conditions,
          and inspect the lot where possible. You are solely responsible for your bidding decisions.
        </p>
      </>
    ),
  },
  {
    id: "accounts",
    title: "Accounts and security",
    body: (
      <>
        <p>
          You must be at least 18 years old and able to form a binding contract under Indian law to create an account. Provide accurate information and keep it
          up to date. You are responsible for activity under your account and for keeping your password confidential. Tell us promptly at {mail} if you suspect
          unauthorised access.
        </p>
        <p>Team seats on Business and Enterprise plans are for named individuals and may not be shared.</p>
      </>
    ),
  },
  {
    id: "subscriptions",
    title: "Plans, billing and refunds",
    body: (
      <>
        <p>
          Some features require a paid plan, described on our <Link href="/pricing">pricing page</Link>. Prices are in Indian Rupees and exclude GST, which is
          added at the applicable rate. Subscriptions renew automatically at the end of each monthly or yearly term until cancelled.
        </p>
        <ul>
          <li>
            <strong>Free trials:</strong> where offered, a trial converts to a paid subscription at its end unless cancelled before then.
          </li>
          <li>
            <strong>Cancellation:</strong> you can cancel at any time from your account. Paid features remain available until the end of the current term.
          </li>
          <li>
            <strong>7-day refund on your first payment:</strong> if you are not satisfied, request a refund within 7 days of your first paid charge for a plan and
            we will refund it in full. Renewals and later payments are not refundable except where required by law.
          </li>
          <li>
            <strong>Price changes:</strong> we will give at least 30 days&apos; notice before a price change takes effect on your next renewal.
          </li>
        </ul>
        <p>Refunds are made to the original payment method, normally within 5–7 working days of approval.</p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>scrape, crawl, bulk-download or resell the Service or its data, except through an API we provide to you under a separate agreement;</li>
          <li>attempt to access accounts, systems or data you are not authorised to use, or interfere with the Service&apos;s security or performance;</li>
          <li>use the Service to commit fraud, impersonate others, manipulate auctions, form bidding cartels or break any law;</li>
          <li>upload malware or content that is unlawful, infringing or misleading;</li>
          <li>reverse-engineer the Service except where the law expressly allows it.</li>
        </ul>
        <p>We may suspend or close accounts that breach these rules, with notice where practical.</p>
      </>
    ),
  },
  {
    id: "content",
    title: "Your content",
    body: (
      <p>
        Documents, quotes, inventory and notes you upload remain yours. You grant us a limited licence to store, process and display them only to provide the
        Service to you and your team. You confirm you have the right to upload them.
      </p>
    ),
  },
  {
    id: "ip",
    title: "Intellectual property",
    body: (
      <p>
        The Service, including its software, design, text, structured datasets, analytics and the Lelam name and logo, is owned by Lelam or its licensors and
        protected by law. We grant you a personal, non-exclusive, non-transferable licence to use the Service for its intended purpose while your account is in
        good standing. Public-domain information from official sources remains in the public domain.
      </p>
    ),
  },
  {
    id: "third-parties",
    title: "Third-party sites and partners",
    body: (
      <p>
        The Service links to official portals and may connect you with logistics or other partners. Their services are governed by their own terms. We are not
        responsible for third-party sites, partners or their acts and omissions.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Disclaimers and limitation of liability",
    body: (
      <>
        <p>
          The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. To the extent permitted by law, we disclaim all implied warranties,
          including fitness for a particular purpose and accuracy of information.
        </p>
        <p>
          To the extent permitted by law, Lelam is not liable for indirect, incidental, special or consequential losses, including lost profits, a lost auction,
          forfeited EMD or penalties imposed by a seller. Our total liability for any claim relating to the Service is limited to the amount you paid us in the 12
          months before the claim arose. Nothing in these Terms limits liability that cannot be limited under applicable law.
        </p>
      </>
    ),
  },
  {
    id: "termination",
    title: "Suspension and termination",
    body: (
      <p>
        You may close your account at any time. We may suspend or terminate access if you breach these Terms, if required by law, or if continuing would expose
        users or Lelam to harm. Sections that by their nature should survive termination (including intellectual property, disclaimers, liability and governing
        law) will survive.
      </p>
    ),
  },
  {
    id: "law",
    title: "Governing law and disputes",
    body: (
      <p>
        These Terms are governed by the laws of India. Subject to any mandatory consumer protections, the courts at Bengaluru, Karnataka have exclusive
        jurisdiction over disputes arising from these Terms or the Service. Before going to court, please write to {mail} so we can try to resolve the issue
        informally within 30 days.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes and contact",
    body: (
      <>
        <p>
          We may update these Terms. For material changes we will notify you by email or in the app at least 15 days before they take effect. Continuing to use
          the Service after that date means you accept the updated Terms.
        </p>
        <p>
          Contact: {mail}, {SUPPORT.phone}, {SUPPORT.address.join(", ")}.
        </p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title={
        <>
          Terms of <Accent>Service</Accent>
        </>
      }
      intro="The rules for using Lelam, in plain language where we can manage it. The short version: we help you research public auctions, you bid on the official portal, and we never touch your EMD."
      sections={SECTIONS}
    />
  );
}
