"use client";

import { useEffect, useState } from "react";

/** Desktop-only floating quote/WhatsApp pill. Hides when the quote form is on screen. */
export function FloatingCta({ whatsappHref, external, label }: { whatsappHref: string; external: boolean; label: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [atForm, setAtForm] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const form = document.getElementById("quote");
    const io = form ? new IntersectionObserver(([e]) => setAtForm(e.isIntersecting)) : null;
    if (form && io) io.observe(form);
    return () => {
      window.removeEventListener("scroll", onScroll);
      io?.disconnect();
    };
  }, []);

  const show = scrolled && !atForm;
  return (
    <div className={`fcta ${show ? "on" : ""}`} aria-hidden={!show} {...(!show ? { inert: true } : {})}>
      <a className="btn btn-wa" href={whatsappHref} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>WhatsApp</a>
      <a className="btn btn-primary" href="#quote">{label}</a>
    </div>
  );
}
