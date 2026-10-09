"use client";

import { useEffect } from "react";

/** Remembers the first landing page + UTM tags for this visit so the booking form can attach them. */
export function AttributionCapture() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem("gcs_attr")) return;
      const p = new URLSearchParams(window.location.search);
      const attr: Record<string, string> = { source: window.location.pathname.slice(0, 300) };
      for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
        const v = p.get(k);
        if (v) attr[k] = v.slice(0, 100);
      }
      sessionStorage.setItem("gcs_attr", JSON.stringify(attr));
    } catch { /* storage blocked — attribution is optional */ }
  }, []);
  return null;
}
