import type { Metadata } from "next";
import { crmContext } from "@/lib/crm/service";
import { findQuoteByToken } from "@/lib/crm/quotes";
import { formatMoney } from "@/lib/crm/money";
import { PageHero } from "@/components/site/page-hero";
import { AcceptButton } from "./accept-button";
import { CONTACT } from "@/lib/site/config";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Your Quotation",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function AcceptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const ctx = await crmContext();
  // GET never changes anything: it only shows the quotation and asks for explicit confirmation.
  const q = await findQuoteByToken(ctx.db, token);
  const today = new Date().toISOString().slice(0, 10);
  const expired = !!q && (q.status === "expired" || (!!q.valid_until && q.valid_until < today));
  const current = !!q && !q.superseded_by_id && ["sent", "viewed", "accepted"].includes(q.status);

  return (
    <>
      <PageHero crumbs={[{ name: "Your quotation" }]} title={<>Your <em>quotation.</em></>} lede="Review the summary below. Accepting lets us know you would like to proceed — it is not a payment, and your booking is confirmed only when we confirm it to you in writing." />
      <section className="section--tight">
        <div className="wrap prose">
          {!q || !current ? (
            <>
              <h2>This link is no longer valid</h2>
              <p>The quotation link is invalid, has been replaced by a newer version, or is no longer active. Please reply to our email or contact us at <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> and we will help.</p>
            </>
          ) : expired ? (
            <>
              <h2>This quotation has expired</h2>
              <p>The validity period for quotation {q.quote_number} has ended, so prices and availability need to be re-confirmed. Please contact us at <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>.</p>
            </>
          ) : (
            <>
              <h2>Quotation {q.quote_number}</h2>
              <ul>
                <li>{q.pickup_location}{q.dropoff_location ? ` → ${q.dropoff_location}` : ""}</li>
                <li>{[q.pickup_date, q.pickup_time].filter(Boolean).join(" at ")}</li>
                {q.vehicle_category && <li>{q.vehicle_category}</li>}
                <li><strong>Total: {formatMoney(Math.round(q.total * 100), q.currency)}</strong></li>
                <li>Valid until {q.valid_until}</li>
              </ul>
              {q.status === "accepted" ? (
                <p role="status"><strong>Thank you — you have already accepted this quotation.</strong> We will be in touch to confirm your booking.</p>
              ) : (
                <AcceptButton token={token} />
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
