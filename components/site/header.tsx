"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV } from "@/lib/site/content";
import { QUOTE_HREF } from "@/lib/site/config";

interface HeaderProps {
  whatsappHref: string;
  whatsappExternal: boolean;
}

export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="Greece Chauffeur Service — home">
      <b>GREECE</b>
      <span>CHAUFFEUR SERVICE</span>
    </Link>
  );
}

export function Header({ whatsappHref, whatsappExternal }: HeaderProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname; // menu closes itself on navigation
  const setOpen = (fn: boolean | ((v: boolean) => boolean)) =>
    setOpenAt((cur) => ((typeof fn === "function" ? fn(cur === pathname) : fn) ? pathname : null));
  // Pages that open with a full-bleed hero keep the header transparent until scroll.
  const overHero = pathname === "/" || /^\/services\/[^/]+$/.test(pathname);
  const solid = !overHero || scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenAt(null);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const ext = whatsappExternal ? { target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <>
      <header className={`hdr ${solid && !open ? "is-solid" : ""} ${open ? "menu-open" : ""}`}>
        <div className="wrap hdr-in">
          <Logo />
          <nav className="nav" aria-label="Primary">
            {NAV.map((n) => (
              <Link key={n.label} href={n.href} aria-current={pathname === n.href ? "page" : undefined}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="hdr-cta">
            <a className="btn btn-wa" href={whatsappHref} {...ext}>WhatsApp</a>
            <Link className="btn btn-primary" href={QUOTE_HREF}>Request a Quote</Link>
          </div>
          <button
            className="burger"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <i /><i /><i />
          </button>
        </div>
      </header>
      <div id="mobile-menu" className={`drawer ${open ? "open" : ""}`} aria-hidden={!open} {...(!open ? { inert: true } : {})}>
        <nav aria-label="Mobile">
          {NAV.map((n) => (
            <Link key={n.label} href={n.href} className="dl">{n.label}</Link>
          ))}
        </nav>
        <a className="btn btn-wa" href={whatsappHref} {...ext}>WhatsApp</a>
        <Link className="btn btn-primary" href={QUOTE_HREF}>Request a Private Quote</Link>
      </div>
      <div className="mbar">
        <a className="btn btn-wa" href={whatsappHref} {...ext}>WhatsApp</a>
        <Link className="btn btn-primary" href={QUOTE_HREF}>Request Quote</Link>
      </div>
    </>
  );
}
