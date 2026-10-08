"use client";

import { useInView } from "../reveal";

/** Numbered timeline; the connecting line draws in when scrolled into view. */
export function Steps({ steps }: { steps: { t: string; d: string }[] }) {
  const [ref, seen] = useInView<HTMLOListElement>(0.25);
  return (
    <ol ref={ref} className={`steps ${seen ? "in" : ""}`} style={{ ["--cols" as string]: steps.length }}>
      {steps.map((s, i) => (
        <li key={s.t} className="step">
          <span className="n">{String(i + 1).padStart(2, "0")}</span>
          <h3>{s.t}</h3>
          <p>{s.d}</p>
        </li>
      ))}
    </ol>
  );
}
