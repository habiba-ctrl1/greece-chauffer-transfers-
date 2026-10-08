"use client";

import { MAP_NODES } from "@/lib/site/content";
import { useInView } from "./reveal";

type N = (typeof MAP_NODES)[number];
const hub = MAP_NODES[0];
const others = MAP_NODES.slice(1);

// Curve control point: pushed sideways from the midpoint so routes feel drawn, not ruled.
const ctrl = (a: N, b: N, i: number) => {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y;
  const k = i % 2 ? 0.18 : -0.18;
  return { x: mx - dy * k, y: my + dx * k };
};
const seg = (a: N, b: N, i: number) => {
  const c = ctrl(a, b, i);
  return `Q ${c.x.toFixed(1)} ${c.y.toFixed(1)} ${b.x} ${b.y}`;
};

/** Conceptual coverage diagram — deliberately not a geographic map. */
export function GreeceMap() {
  const [ref, seen] = useInView<HTMLDivElement>(0.3);
  // `seen` only flips on the client, so reading matchMedia here is safe from hydration mismatch.
  const motion = seen && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // One drive: out to a node and back to Athens, node after node.
  const drive =
    `M ${hub.x} ${hub.y} ` +
    others.map((n, i) => `${seg(hub, n, i)} ${seg(n, hub, i)}`).join(" ");

  return (
    <div ref={ref} className={seen ? "in" : ""}>
      <svg className="map-svg" viewBox="0 0 600 520" role="img" aria-labelledby="map-t map-d">
        <title id="map-t">Service coverage across Greece</title>
        <desc id="map-d">
          A conceptual diagram of Athens connected to Attica, the Peloponnese, Central Greece, Northern Greece, Crete and the major islands.
        </desc>
        {[70, 130, 190, 250].map((r) => (
          <circle key={r} className="map-ring" cx={hub.x} cy={hub.y} r={r} />
        ))}
        {others.map((n, i) => (
          <path key={n.id} className="map-route" d={`M ${hub.x} ${hub.y} ${seg(hub, n, i)}`} style={{ transitionDelay: `${i * 220}ms` }} />
        ))}
        {others.map((n) => (
          <g key={n.id} className="map-node">
            <circle cx={n.x} cy={n.y} r={6} />
            <text x={n.x + 12} y={n.y + 4}>{n.label}</text>
          </g>
        ))}
        <g className="map-node hub">
          <circle cx={hub.x} cy={hub.y} r={9} />
          <text x={hub.x + 16} y={hub.y + 5} style={{ fontSize: 15 }}>{hub.label}</text>
        </g>
        {motion && (
          <rect className="map-car" x={-7} y={-3.5} width={14} height={7} rx={3.5}>
            <animateMotion dur="26s" begin="0.8s" repeatCount="1" fill="freeze" rotate="auto" path={drive} />
          </rect>
        )}
      </svg>
    </div>
  );
}
