import type { Metadata } from "next";
import Link from "next/link";
import { SUPPORT } from "@/lib/site";
import { Accent } from "@/components/ui/primitives";
import { LegalLayout, type LegalSection } from "@/components/content/legal-layout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Lelam collects, uses, retains and protects personal data under India's Digital Personal Data Protection Act, 2023, and how to exercise your rights.",
  alternates: { canonical: "/privacy" },
};

const mail = <a href={`mailto:${SUPPORT.email}`}>{SUPPORT.email}</a>;

const SECTIONS: LegalSection[] = [
  {
    id: "overview",
    title: "Who we are and this policy",
    body: (
      <>
        <p>
          Lelam (&ldquo;we&rdquo;) operates lelam.co and is the Data Fiduciary for the personal data described here, within the meaning of India&apos;s Digital
          Personal Data Protection Act, 2023 (&ldquo;DPDP Act&rdquo;) and the rules made under it. This policy explains what we collect, why, how long we keep
          it, and the rights you have as a Data Principal.
        </p>
        <p>We do not sell personal data, and we do not show third-party advertising.</p>
      </>
    ),
  },
  {
    id: "data-we-collect",
    title: "Data we collect",
    body: (
      <>
        <h3>Data you give us</h3>
        <ul>
          <li>
            <strong>Account:</strong> name, email address, password (stored only as a salted hash), role and plan.
          </li>
          <li>
            <strong>Profile and billing:</strong> phone, company name, billing name, GSTIN, address and pincode for invoices.
          </li>
          <li>
            <strong>Documents and workspace data:</strong> files you upload to the document vault (for example PAN, GSTIN or PCB certificates), watchlists,
            reminders, inventory, quotes and shipping requests.
          </li>
          <li>
            <strong>Messages:</strong> what you send through the contact and sales forms or the in-app assistant.
          </li>
        </ul>
        <h3>Data collected automatically</h3>
        <ul>
          <li>Essential cookies and similar storage, described in our <Link href="/cookies">Cookie Policy</Link>.</li>
          <li>Technical logs: IP address, browser type, pages requested and timestamps, used for security and reliability.</li>
        </ul>
        <h3>Payments</h3>
        <p>
          Card, UPI and bank details are entered with our payment processor and are not stored by Lelam. We receive only a payment reference, status and the
          last digits or method type.
        </p>
      </>
    ),
  },
  {
    id: "purposes",
    title: "Why we use it",
    body: (
      <>
        <p>We process personal data only for specified, lawful purposes, on the basis of your consent or for legitimate uses permitted by the DPDP Act:</p>
        <ul>
          <li>to create and secure your account and provide the features of your plan;</li>
          <li>to process subscriptions, issue GST invoices and handle refunds;</li>
          <li>to send alerts, reminders and service messages you have asked for;</li>
          <li>to answer support and sales requests;</li>
          <li>to detect fraud and abuse, and to keep the Service secure;</li>
          <li>to comply with legal obligations such as tax and accounting records.</li>
        </ul>
        <p>Marketing emails are sent only with your consent, and every message includes a way to opt out.</p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Who we share it with",
    body: (
      <>
        <p>We share personal data only as needed to run the Service, under contracts that require appropriate safeguards:</p>
        <ul>
          <li>hosting, storage, email delivery and payment processors acting as our Data Processors;</li>
          <li>logistics partners, only when you choose to send them a quote or shipping request;</li>
          <li>authorities, where required by law or a valid legal order.</li>
        </ul>
        <p>We do not share your data with auction portals or sellers. Some processors may store data outside India where the law permits it.</p>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <ul>
        <li>Account and workspace data: while your account is active, and deleted within 90 days of closing it.</li>
        <li>Invoices and payment records: 8 years, as required by Indian tax and accounting law.</li>
        <li>Support messages: up to 2 years after the request is resolved.</li>
        <li>Security logs: up to 180 days, unless needed to investigate an incident.</li>
      </ul>
    ),
  },
  {
    id: "security",
    title: "How we protect it",
    body: (
      <p>
        We use reasonable security safeguards including encryption in transit, hashed passwords, signed HttpOnly session cookies, access controls and logging.
        If a personal data breach occurs, we will notify the Data Protection Board of India and affected users as the DPDP Act requires.
      </p>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    body: (
      <>
        <p>Under the DPDP Act you can:</p>
        <ul>
          <li>ask for a summary of the personal data we process about you and who we have shared it with;</li>
          <li>ask us to correct, complete, update or erase your personal data;</li>
          <li>withdraw consent at any time, as easily as you gave it (this does not affect processing already carried out);</li>
          <li>nominate another person to exercise your rights in the event of death or incapacity;</li>
          <li>raise a grievance with us, and then with the Data Protection Board of India if you are not satisfied.</li>
        </ul>
        <p>Email {mail} from the address on your account. We respond within 30 days.</p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: <p>The Service is not intended for anyone under 18. We do not knowingly process children&apos;s personal data; if we learn we have, we will delete it.</p>,
  },
  {
    id: "grievance",
    title: "Grievance officer and contact",
    body: (
      <>
        <p>
          For questions or complaints about personal data, contact our Grievance Officer at {mail}, or write to Lelam, {SUPPORT.address.join(", ")}. Phone:{" "}
          {SUPPORT.phone} ({SUPPORT.hours}).
        </p>
        <p>We may update this policy. Material changes will be notified by email or in the app before they take effect.</p>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title={
        <>
          Privacy <Accent>Policy</Accent>
        </>
      }
      intro="What personal data Lelam handles, why, and how you stay in control, written to India's Digital Personal Data Protection Act, 2023."
      sections={SECTIONS}
    />
  );
}
