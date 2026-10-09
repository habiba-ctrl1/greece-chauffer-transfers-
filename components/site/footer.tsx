import Link from "next/link";
import { BRAND, CONTACT, phoneHref, whatsappHref } from "@/lib/site/config";
import { DESTINATIONS, SERVICES } from "@/lib/site/content";
import { Logo } from "./header";

export function Footer() {
  const services = SERVICES;
  return (
    <footer className="ftr">
      <div className="wrap">
        <div className="ftr-grid">
          <div>
            <Logo />
            <p style={{ marginTop: 20, maxWidth: "30ch" }}>{BRAND.tagline}</p>
          </div>
          <nav aria-label="Services">
            <h4>Services</h4>
            <ul>
              <li><Link href="/services">All services</Link></li>
              {services.map((s) => (<li key={s.slug}><Link href={`/services/${s.slug}`}>{s.cta}</Link></li>))}
              <li><Link href="/#fleet">Fleet</Link></li>
            </ul>
          </nav>
          <nav aria-label="Destinations">
            <h4>Destinations</h4>
            <ul>
              {DESTINATIONS.map((d) => (<li key={d.slug}><Link href={`/destinations/${d.slug}`}>{d.name}</Link></li>))}
            </ul>
          </nav>
          <nav aria-label="Company">
            <h4>Company</h4>
            <ul>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/faq">FAQ</Link></li>
              <li><Link href="/privacy">Privacy notice</Link></li>
              <li><Link href="/#partners">Partner With Us</Link></li>
            </ul>
          </nav>
          <div>
            <h4>Contact</h4>
            <ul>
              {CONTACT.phone && phoneHref && <li><a href={phoneHref}>{CONTACT.phone}</a></li>}
              {CONTACT.whatsapp && <li><a href={whatsappHref()} target="_blank" rel="noopener noreferrer">WhatsApp</a></li>}
              {CONTACT.email && <li><a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></li>}
              <li><Link href="/contact#quote">Request a quote</Link></li>
            </ul>
          </div>
        </div>
        <div className="ftr-base">
          <span>© {new Date().getFullYear()} {BRAND.name}</span>
          <span>Private transportation · Greece</span>
        </div>
      </div>
    </footer>
  );
}
