"use client";

import { useState, useTransition } from "react";
import { acceptQuotationByToken } from "@/lib/actions/accept";

const MESSAGES: Record<string, string> = {
  accepted: "Thank you — we have recorded your acceptance. We will contact you shortly to confirm your booking.",
  already_accepted: "This quotation has already been accepted. We will be in touch to confirm your booking.",
  expired: "This quotation has expired. Please contact us so we can re-confirm prices and availability.",
  not_current: "This quotation has been replaced by a newer version. Please use the latest email from us.",
  invalid: "This link is not valid any more. Please reply to our email and we will help.",
  rate_limited: "Too many attempts. Please wait a few minutes and try again.",
};

export function AcceptButton({ token }: { token: string }) {
  const [done, setDone] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (done) return <p role="status"><strong>{MESSAGES[done] ?? MESSAGES.invalid}</strong></p>;
  return (
    <p>
      <button type="button" className="btn btn-primary" disabled={pending} onClick={() => start(async () => setDone((await acceptQuotationByToken(token)).outcome))}>
        {pending ? "Recording…" : "Accept this quotation"}
      </button>
    </p>
  );
}
