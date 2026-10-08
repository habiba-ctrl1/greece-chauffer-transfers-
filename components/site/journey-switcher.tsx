"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { JOURNEYS, img } from "@/lib/site/content";
import { Photo } from "./photo";
import { ArrowRight } from "./icons";

export function JourneySwitcher() {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const j = JOURNEYS[active];

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const next = e.key === "ArrowDown" || e.key === "ArrowRight" ? i + 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? i - 1 : null;
    if (next === null) return;
    e.preventDefault();
    const n = (next + JOURNEYS.length) % JOURNEYS.length;
    setActive(n);
    tabs.current[n]?.focus();
  };

  return (
    <section className="section on-navy" aria-labelledby="journey-title">
      <div className="wrap">
        <header className="section-head">
          <p className="eyebrow"><span className="chapter">Relax</span><span aria-hidden="true">—</span>Choose your journey</p>
          <h2 id="journey-title" className="h2">Arrive. Explore. <em>Move.</em></h2>
        </header>
        <div className="jsw">
          <div>
            <div className="jtabs" role="tablist" aria-label="Choose your journey" aria-orientation="vertical">
              {JOURNEYS.map((t, i) => (
                <button
                  key={t.id}
                  ref={(el) => { tabs.current[i] = el; }}
                  role="tab"
                  id={`jt-${t.id}`}
                  aria-selected={i === active}
                  aria-controls="journey-panel"
                  tabIndex={i === active ? 0 : -1}
                  className="jtab"
                  onClick={() => setActive(i)}
                  onKeyDown={(e) => onKey(e, i)}
                >
                  <b>{t.label}</b>
                  <small>{t.sub}</small>
                </button>
              ))}
            </div>
            <div key={j.id} id="journey-panel" role="tabpanel" aria-labelledby={`jt-${j.id}`} className="jpanel">
              <h3>{j.title}</h3>
              <p>{j.text}</p>
              <Link className="btn btn-primary" href={j.href} style={{ justifySelf: "start" }}>{j.cta} <ArrowRight /></Link>
            </div>
          </div>
          <div className="jimg" aria-hidden="true">
            {JOURNEYS.map((t, i) => (
              <Photo key={t.id} src={img(t.image)} alt="" sizes="(min-width: 960px) 55vw, 100vw" className={i === active ? "on" : ""} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
