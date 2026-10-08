// Single source of truth for brand + contact details.
// Contact values come from env so nothing is invented: unset values are hidden
// (footer) or fall back to the quote form (WhatsApp / call buttons).
// NEXT_PUBLIC_* values are inlined at build time — set them in the deploy workflow.

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://greecechaufferservice.com"
).replace(/\/$/, "");

export const BRAND = {
  name: "Greece Chauffeur Service",
  short: "Greece Chauffeur",
  tagline: "Private chauffeur and premium transportation services across Greece.",
};

const clean = (v?: string) => (v && v.trim() ? v.trim() : undefined);

export const CONTACT = {
  /** digits only, international format, e.g. 306900000000 */
  whatsapp: clean(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER)?.replace(/\D/g, ""),
  phone: clean(process.env.NEXT_PUBLIC_PHONE),
  email: clean(process.env.NEXT_PUBLIC_CONTACT_EMAIL),
};

export const whatsappHref = (text = "Hello, I'd like a quote for a private transfer in Greece.") =>
  CONTACT.whatsapp
    ? `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`
    : "/contact#quote";

export const phoneHref = CONTACT.phone ? `tel:${CONTACT.phone.replace(/[^\d+]/g, "")}` : undefined;

export const QUOTE_HREF = "/contact#quote";
