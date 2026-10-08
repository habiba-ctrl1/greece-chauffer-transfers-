import type { ReactNode } from "react";

interface Props {
  eyebrow: string;
  /** Story chapter: Arrive → Relax → Explore → Depart */
  chapter?: "Arrive" | "Relax" | "Explore" | "Depart";
  id?: string;
  children: ReactNode; // heading content
  lede?: ReactNode;
  center?: boolean;
  level?: 2 | 1;
}

export function SectionHeading({ eyebrow, chapter, id, children, lede, center, level = 2 }: Props) {
  const H = level === 1 ? "h1" : "h2";
  return (
    <header className={`section-head ${center ? "center" : ""}`}>
      <p className="eyebrow">
        {chapter && <span className="chapter">{chapter}</span>}
        {chapter && <span aria-hidden="true">—</span>}
        {eyebrow}
      </p>
      <H id={id} className="h2">{children}</H>
      {lede && <p className="lede">{lede}</p>}
    </header>
  );
}
