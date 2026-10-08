import type { CSSProperties } from "react";
import type { IllustrationName } from "@/lib/site/services/types";

// Thin-line architectural illustrations. Strokes draw in once on load (CSS, see .ill .draw);
// they are static for reduced-motion users. Decorative: the hero text carries the meaning.

const P = ({ d, delay = 0, dash }: { d: string; delay?: number; dash?: string }) => (
  <path className="draw" pathLength={1} d={d} style={{ "--d": `${delay}ms`, ...(dash ? { strokeDasharray: dash } : {}) } as CSSProperties} />
);

const Car = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} className="fade" style={{ "--d": "900ms" } as CSSProperties}>
    <path d="M0 24 Q2 12 14 10 L26 8 Q34 0 48 0 H62 Q74 0 80 9 L90 12 Q96 14 96 22 V28 H0Z" />
    <path d="M30 8 Q38 3 48 3 H62 Q70 3 75 9Z" />
    <circle cx="22" cy="28" r="7" /><circle cx="76" cy="28" r="7" />
  </g>
);

const Label = ({ x, y, children, anchor = "start" }: { x: number; y: number; children: string; anchor?: "start" | "middle" | "end" }) => (
  <text className="lbl" x={x} y={y} textAnchor={anchor}>{children}</text>
);

const Plane = ({ x, y, r = 0 }: { x: number; y: number; r?: number }) => (
  <g transform={`translate(${x} ${y}) rotate(${r})`}>
    <path d="M-14 0 L14 -2 L18 0 L14 2Z M-2 0 L-10 -11 L-6 -11 L6 -1 M-2 0 L-10 11 L-6 11 L6 1 M-14 0 L-18 -6 L-15 -6 L-9 -1" />
  </g>
);

function Airport() {
  const ends = [["Hotel", 45], ["Port", 88], ["Villa", 131], ["Destination", 174]] as const;
  return (
    <>
      <P d="M24 150 V108 H118 V150 M24 122 H118 M42 108 V150 M60 108 V150 M78 108 V150 M96 108 V150 M16 108 H126" />
      <Label x={24} y={168}>Airport</Label>
      <P d="M30 40 Q96 6 150 64" dash="2 4" delay={200} />
      <g className="fade" style={{ "--d": "1100ms" } as CSSProperties}><Plane x={154} y={66} r={55} /></g>
      <P d="M130 150 H290" delay={500} />
      <Car x={162} y={122} />
      {ends.map(([l, y], i) => (
        <g key={l}>
          <P d={`M290 150 Q340 150 392 ${y}`} delay={900 + i * 150} dash="3 4" />
          <circle className="node" cx={394} cy={y} r={3.5} />
          <Label x={406} y={y + 4}>{l}</Label>
        </g>
      ))}
    </>
  );
}

function Port() {
  return (
    <>
      <P d="M18 134 H112 L102 160 H34Z M32 134 V112 H98 V134 M46 112 V96 H84 V112 M64 96 V80 M58 80 H70 M40 120 H46 M54 120 H60 M68 120 H74 M82 120 H88" />
      <P d="M8 176 q12 -7 24 0 t24 0 t24 0 t24 0 t24 0" delay={300} />
      <Label x={22} y={196}>Ship</Label>
      <P d="M140 150 H440" delay={500} />
      <Car x={218} y={122} />
      <Label x={266} y={196} anchor="middle">Chauffeur</Label>
      <P d="M404 150 V110 M404 110 a18 18 0 1 1 0.1 0" delay={1000} />
      <circle className="node" cx={404} cy={92} r={4} />
      <Label x={404} y={196} anchor="middle">Destination</Label>
    </>
  );
}

function Chauffeur() {
  return (
    <>
      <P d="M44 60 a14 14 0 1 1 0.1 0 M44 76 V130 M24 96 L44 88 L64 96 M44 130 L32 168 M44 130 L56 168" />
      <Label x={44} y={196} anchor="middle">You</Label>
      <P d="M170 68 a13 13 0 1 1 0.1 0 M170 82 V132 M152 98 L170 92 L188 98 M170 132 L160 168 M170 132 L180 168 M158 56 H182" delay={400} />
      <Label x={170} y={196} anchor="middle">Chauffeur</Label>
      <P d="M236 150 H450" delay={800} />
      <Car x={300} y={122} s={1.25} />
      <Label x={360} y={196} anchor="middle">Your vehicle</Label>
    </>
  );
}

function Intercity() {
  const nodes = [
    { l: "Athens", x: 150, y: 150, hub: true },
    { l: "Nafplio", x: 110, y: 196 },
    { l: "Delphi", x: 190, y: 74 },
    { l: "Meteora", x: 230, y: 24 },
    { l: "Sounion", x: 214, y: 196 },
  ];
  return (
    <>
      <path className="ring" d="M150 150 m-60 0 a60 60 0 1 0 120 0 a60 60 0 1 0 -120 0 M150 150 m-110 0 a110 110 0 1 0 220 0 a110 110 0 1 0 -220 0" />
      {nodes.slice(1).map((n, i) => (
        <P key={n.l} d={`M150 150 Q${(150 + n.x) / 2 + (i % 2 ? 18 : -18)} ${(150 + n.y) / 2} ${n.x} ${n.y}`} delay={300 + i * 250} />
      ))}
      {nodes.map((n) => (
        <g key={n.l}>
          <circle className={n.hub ? "node hub" : "node"} cx={n.x} cy={n.y} r={n.hub ? 6 : 4} />
          <Label x={n.x + 10} y={n.y + 4}>{n.l}</Label>
        </g>
      ))}
      <Car x={310} y={100} />
      <P d="M296 140 H450" delay={900} />
      <Label x={372} y={172} anchor="middle">Door to door</Label>
    </>
  );
}

function Tours() {
  return (
    <>
      <P d="M20 110 L66 82 L112 110 M26 110 H106 M34 110 V152 M50 110 V152 M66 110 V152 M82 110 V152 M98 110 V152 M20 152 H112 M16 160 H116" />
      <Label x={66} y={186} anchor="middle">Landmark</Label>
      <P d="M130 152 H350" delay={500} />
      <Car x={190} y={124} />
      <Label x={238} y={186} anchor="middle">Your vehicle</Label>
      <P d="M360 152 L392 104 L410 128 L426 96 L452 152Z" delay={800} />
      <circle className="node" cx={436} cy={64} r={10} />
      <Label x={406} y={186} anchor="middle">Destination</Label>
    </>
  );
}

function Corporate() {
  return (
    <>
      <P d="M26 160 V70 H78 V160 M26 160 H90 M38 84 H48 M58 84 H68 M38 104 H48 M58 104 H68 M38 124 H48 M58 124 H68" />
      <Label x={52} y={184} anchor="middle">Hotel</Label>
      <P d="M104 150 H220" delay={400} dash="3 4" />
      <P d="M232 120 H318 M240 120 V150 M310 120 V150 M254 104 H304 M254 104 V120 M304 104 V120" delay={600} />
      <Label x={274} y={184} anchor="middle">Meeting</Label>
      <P d="M330 150 H390" delay={900} dash="3 4" />
      <g className="fade" style={{ "--d": "1300ms" } as CSSProperties}><Plane x={424} y={110} r={-20} /><path d="M396 160 H452" /></g>
      <Label x={424} y={184} anchor="middle">Airport</Label>
    </>
  );
}

const MAP = { airport: Airport, port: Port, chauffeur: Chauffeur, intercity: Intercity, tours: Tours, corporate: Corporate };

export function ServiceIllustration({ name, label }: { name: IllustrationName; label: string }) {
  const Art = MAP[name];
  return (
    <svg className="ill" viewBox="0 0 480 210" role="img" aria-label={label}>
      <Art />
    </svg>
  );
}
