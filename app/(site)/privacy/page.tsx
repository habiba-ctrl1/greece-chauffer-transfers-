import type { Metadata } from "next";
import { PageHero } from "@/components/site/page-hero";
import { BRAND, CONTACT } from "@/lib/site/config";

export const metadata: Metadata = {
  title: "Privacy Notice",
  description: "How Greece Chauffeur Service handles the details you share when requesting a quotation.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <PageHero crumbs={[{ name: "Privacy notice" }]} title={<>Privacy <em>notice.</em></>} lede="What we collect when you request a quotation, why, and how to ask us to remove it." />
      <section className="section--tight">
        <div className="wrap prose">
          <h2>Who we are</h2>
          <p>{BRAND.name} provides private chauffeur and transfer services in Greece. You can contact us at <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>.</p>

          <h2>What we collect</h2>
          <ul>
            <li>Your name, email address and phone number.</li>
            <li>Journey details you enter: pickup and drop-off, dates and times, passenger and luggage details, flight or ship details, and any notes.</li>
            <li>The page you started from and, where present, campaign tags in the link you followed (for example <em>utm_source</em>), so we can see which pages bring requests.</li>
          </ul>
          <p>We do not collect payment card details through this form.</p>

          <h2>Why we use it</h2>
          <p>To reply to your request, prepare and send you a quotation, and — if you go ahead — to arrange and run your journey. We send you an acknowledgement when your request arrives and may follow up on your request or quotation. We do not use these details for unrelated marketing.</p>

          <h2>Who handles it</h2>
          <p>Your request is stored in our booking system hosted on Cloudflare, and emails are delivered through an email-delivery provider. Our own team reads your request to reply to you. We do not sell your details.</p>

          <h2>How long we keep it</h2>
          <p>We keep your request only for as long as needed to handle it and to meet our legal and accounting obligations.</p>

          <h2>Your rights</h2>
          <p>You can ask us at any time to see, correct or delete the details we hold about you, or to stop contacting you, by emailing <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>. You also have the right to complain to your data-protection authority.</p>
        </div>
      </section>
    </>
  );
}
