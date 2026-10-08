import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./site.css";
import "./service.css";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { BRAND, CONTACT, SITE_URL, whatsappHref } from "@/lib/site/config";

const display = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--f-display", display: "swap" });
const body = Manrope({ subsets: ["latin"], variable: "--f-body", display: "swap" });

export const viewport: Viewport = { themeColor: "#10252b", width: "device-width", initialScale: 1 };

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Private Chauffeur Service Greece | Luxury Transfers & Drivers", template: `%s | ${BRAND.name}` },
  description:
    "Premium private chauffeur service in Greece for airport and port transfers, executive travel, private tours and comfortable journeys across Athens and major destinations.",
  openGraph: { type: "website", siteName: BRAND.name, locale: "en_GB" },
  alternates: { canonical: "./" },
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="site">
        <noscript><style>{".rv{opacity:1!important;transform:none!important}.steps::before{transform:none!important}"}</style></noscript>
        <a className="skip" href="#main">Skip to content</a>
        <Header whatsappHref={whatsappHref()} whatsappExternal={!!CONTACT.whatsapp} />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
