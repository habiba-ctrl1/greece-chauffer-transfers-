import Link from "next/link";
import { Photo } from "./photo";
import { Reveal } from "./reveal";
import { img } from "@/lib/site/content";
import { QUOTE_HREF, whatsappHref, CONTACT } from "@/lib/site/config";
import { WhatsAppGlyph } from "./icons";

export function FinalCta() {
  const wa = whatsappHref();
  return (
    <section className="cta-final" aria-labelledby="cta-title">
      <Photo src={img("coast")} alt="" sizes="100vw" />
      <div className="wrap">
        <Reveal className="in">
          <p className="eyebrow" style={{ justifyContent: "center" }}>Depart</p>
          <h2 id="cta-title" className="h2">Your Greece Journey <em>Starts Here.</em></h2>
          <p>
            Tell us where you&apos;re going, when you&apos;re travelling and who is joining you. We&apos;ll help arrange the
            right private transportation for your journey.
          </p>
          <div className="row">
            <Link className="btn btn-primary" href={QUOTE_HREF}>Request a Private Quote</Link>
            <a className="btn btn-wa" href={wa} {...(CONTACT.whatsapp ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              <WhatsAppGlyph /> WhatsApp Us
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
