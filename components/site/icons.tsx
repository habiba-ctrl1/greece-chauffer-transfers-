import type { IconName } from "@/lib/site/content";

export function ArrowRight() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M3 10h13M11 4.5 16.5 10 11 15.5" />
    </svg>
  );
}

export function Check() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="m4 10.5 4 4 8-9" />
    </svg>
  );
}

export function WhatsAppGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="18" height="18">
      <path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.4A10 10 0 1 0 12 2Zm0 1.9a8.1 8.1 0 1 1-4.3 15l-.3-.2-2.9.8.8-2.8-.2-.3A8.1 8.1 0 0 1 12 3.9Zm-3 3.7c-.2 0-.5 0-.7.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.2 5 4.4 2.4 1 2.9.8 3.4.7.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.7-.4l-1.7-.8c-.2-.1-.5-.2-.7.2l-.8 1c-.1.2-.3.2-.6.1-.3-.2-1.2-.4-2.2-1.4-.8-.8-1.4-1.700-1.5-2-.2-.3 0-.4.1-.6l.5-.6c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.8-2c-.2-.5-.4-.4-.6-.4H9Z" />
    </svg>
  );
}

/** Thin-line Mediterranean-architectural icon set, 48×48, navy/sand via currentColor. */
export function ServiceIcon({ name, className }: { name: IconName; className?: string }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.1, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" {...p}>
      {name === "airport" && (<><path d="M6 31 40 14c2-1 3 1 1 3L30 26l-2 11-3 1-2-9-9 4-2 3-3-1 1-4Z" /><path d="M6 42h36" /></>)}
      {name === "port" && (<><path d="M5 31h38l-5 9H11Z" /><path d="M11 31V21h26v10M17 21v-6h14v6M24 15V9M21 9h6" /><path d="M3 44c4 0 4-2 7-2s4 2 7 2 4-2 7-2 4 2 7 2 4-2 7-2 4 2 7 2" /></>)}
      {name === "chauffeur" && (<><circle cx="24" cy="24" r="16" /><circle cx="24" cy="24" r="4" /><path d="M24 20V8M20.5 26 9 31M27.5 26 39 31" /></>)}
      {name === "intercity" && (<><circle cx="9" cy="38" r="3.5" /><circle cx="39" cy="10" r="3.5" /><path d="M12 36c14 0 4-14 14-16s10 0 10-7" strokeDasharray="2 3" /></>)}
      {name === "tours" && (<><path d="M5 17 24 7l19 10Z" /><path d="M9 17v3h30v-3M12 20v16M20 20v16M28 20v16M36 20v16M7 36h34M5 41h38" /></>)}
      {name === "corporate" && (<><rect x="6" y="15" width="36" height="25" rx="1.5" /><path d="M17 15v-4h14v4M6 26h36M21 26v4h6v-4" /></>)}
      {name === "fleet" && (<><path d="M4 31v-6c0-2 1-3 3-4l8-2 5-6c1-1 2-1 3-1h8c2 0 3 1 4 2l4 6 4 1c2 1 3 2 3 4v6Z" /><circle cx="14" cy="33" r="4" /><circle cx="35" cy="33" r="4" /><path d="M18 33h13M20 13l-3 6h22" /></>)}
      {name === "booking" && (<><rect x="7" y="9" width="34" height="32" rx="1.5" /><path d="M7 19h34M16 5v8M32 5v8M15 28h6M27 28h6M15 34h6" /></>)}
    </svg>
  );
}
