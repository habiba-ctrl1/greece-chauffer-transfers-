// Generates lightweight art-direction placeholders in /public/images.
// These stand in for real photography (see docs/SITE_ARCHITECTURE.md → Image requirements).
// Replace each file with a real photo of the same name (.jpg/.avif) and update img() in
// lib/site/content.ts. Run: node scripts/generate-placeholders.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = new URL("../public/images/", import.meta.url);
mkdirSync(OUT, { recursive: true });
const W = 1600, H = 1000;

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

const sun = (x, y, r, c) =>
  `<circle cx="${x}" cy="${y}" r="${r * 3}" fill="${c}" opacity=".16"/><circle cx="${x}" cy="${y}" r="${r * 1.8}" fill="${c}" opacity=".24"/><circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;

function ridge(y, amp, color, op = 1, n = 9) {
  let d = `M0 ${H} L0 ${y}`;
  for (let i = 1; i <= n; i++) d += ` Q ${(W / n) * (i - 0.5)} ${y - amp * (0.3 + rnd())} ${(W / n) * i} ${y + (rnd() - 0.5) * amp * 0.5}`;
  return `<path d="${d} L${W} ${H}Z" fill="${color}" opacity="${op}"/>`;
}
const sea = (y, a, b) =>
  `<defs><linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect y="${y}" width="${W}" height="${H - y}" fill="url(#sea)"/>` +
  Array.from({ length: 14 }, (_, i) => `<rect x="${rnd() * W}" y="${y + 14 + i * ((H - y) / 15)}" width="${60 + rnd() * 180}" height="1.5" fill="#fff" opacity=".18"/>`).join("");
const cubes = (x0, y0, n, scale = 1, c = "#f7f4ee", shade = "#e0d9cb") =>
  Array.from({ length: n }, (_, i) => {
    const w = (50 + rnd() * 60) * scale, h = (36 + rnd() * 50) * scale, x = x0 + i * 62 * scale + rnd() * 18, y = y0 - h * (0.4 + rnd() * 0.6) - (i % 3) * 18 * scale;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/><rect x="${x + w * 0.62}" y="${y}" width="${w * 0.38}" height="${h}" fill="${shade}"/><rect x="${x + w * 0.14}" y="${y + h * 0.3}" width="${w * 0.16}" height="${h * 0.26}" fill="#315d68" opacity=".55"/>`;
  }).join("");
const columns = (x, y, n, h, c = "#efe7d6") =>
  `<rect x="${x - 14}" y="${y - h - 22}" width="${n * 46 + 14}" height="16" fill="${c}"/><rect x="${x - 6}" y="${y - h - 6}" width="${n * 46}" height="8" fill="${c}"/>` +
  Array.from({ length: n }, (_, i) => `<rect x="${x + i * 46}" y="${y - h}" width="20" height="${h}" fill="${c}"/><rect x="${x + i * 46 + 13}" y="${y - h}" width="7" height="${h}" fill="#000" opacity=".08"/>`).join("") +
  `<rect x="${x - 12}" y="${y}" width="${n * 46 + 10}" height="10" fill="${c}"/>`;
const dome = (x, y, r, c = "#2f6f9a") => `<path d="M${x - r} ${y} A${r} ${r} 0 0 1 ${x + r} ${y}Z" fill="${c}"/><rect x="${x - r}" y="${y}" width="${r * 2}" height="${r * 1.1}" fill="#f7f4ee"/>`;
const windmill = (x, y) =>
  `<path d="M${x - 22} ${y} L${x - 14} ${y - 70} L${x + 14} ${y - 70} L${x + 22} ${y}Z" fill="#f7f4ee"/><path d="M${x - 16} ${y - 70} Q${x} ${y - 100} ${x + 16} ${y - 70}Z" fill="#a88b62"/>` +
  [0, 90, 180, 270].map((a) => `<line x1="${x}" y1="${y - 74}" x2="${x + 62 * Math.cos(((a + 20) * Math.PI) / 180)}" y2="${y - 74 + 62 * Math.sin(((a + 20) * Math.PI) / 180)}" stroke="#e8dfce" stroke-width="5"/>`).join("");
const ship = (x, y, s = 1) =>
  `<path d="M${x} ${y} l${40 * s} ${40 * s} h${360 * s} l${40 * s} ${-40 * s}Z" fill="#10252b"/><rect x="${x + 40 * s}" y="${y - 50 * s}" width="${340 * s}" height="${50 * s}" fill="#f7f4ee"/><rect x="${x + 90 * s}" y="${y - 90 * s}" width="${220 * s}" height="${40 * s}" fill="#efe7d6"/>` +
  Array.from({ length: 14 }, (_, i) => `<rect x="${x + (60 + i * 23) * s}" y="${y - 36 * s}" width="${9 * s}" height="${9 * s}" fill="#315d68" opacity=".6"/>`).join("");
const rocks = () =>
  [[300, 380, 120, 560], [560, 300, 150, 650], [820, 420, 110, 520], [1060, 340, 140, 600], [1300, 460, 100, 480]]
    .map(([x, top, w, h], i) => `<path d="M${x - w / 2} ${H} L${x - w / 2 + 10} ${top + 40} Q${x} ${top - 20} ${x + w / 2 - 10} ${top + 30} L${x + w / 2} ${H}Z" fill="${["#6b6a5f", "#7b7868", "#5d5d54", "#85806e", "#6e6c60"][i]}"/>`)
    .join("");
const plane = (x, y) => `<g transform="translate(${x} ${y}) rotate(-12)"><path d="M0 0 L240 -10 L270 0 L240 10Z" fill="#f7f4ee"/><path d="M110 0 L60 -70 L90 -70 L170 -4Z M110 0 L60 70 L90 70 L170 4Z" fill="#e5ddca"/><path d="M0 0 L-30 -34 L-6 -34 L40 -2Z" fill="#e5ddca"/></g>`;
function car(x, y, s = 1, body = "#0d1b20", glass = "#2a4a55") {
  return `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="220" cy="92" rx="250" ry="14" fill="#000" opacity=".28"/>
  <path d="M0 70 Q4 40 40 34 L110 28 Q150 -6 215 -8 L300 -8 Q360 -6 400 28 L470 40 Q490 48 492 70 L492 84 L0 84Z" fill="${body}"/>
  <path d="M128 28 Q160 4 215 2 L290 2 Q340 4 372 28Z" fill="${glass}"/>
  <path d="M0 62 H492" stroke="#fff" stroke-opacity=".12" stroke-width="2"/>
  <circle cx="110" cy="86" r="30" fill="#05090b"/><circle cx="110" cy="86" r="14" fill="#2b3a40"/>
  <circle cx="390" cy="86" r="30" fill="#05090b"/><circle cx="390" cy="86" r="14" fill="#2b3a40"/>
  <rect x="470" y="48" width="22" height="8" rx="3" fill="#fbe9b8"/></g>`;
}
function vehicle(kind) {
  const bodies = {
    sedan: `<path d="M120 300 Q124 262 170 256 L260 248 Q310 216 390 214 L520 214 Q600 218 650 256 L730 266 Q760 272 764 300 L764 320 L120 320Z" fill="#10252b"/><path d="M290 250 Q330 226 395 224 L510 224 Q570 228 610 252Z" fill="#315d68"/>`,
    premium: `<path d="M110 300 Q116 258 168 252 L262 244 Q318 208 400 206 L530 206 Q612 212 664 252 L748 264 Q780 270 784 300 L784 320 L110 320Z" fill="#0a171b"/><path d="M296 246 Q338 218 404 216 L520 216 Q584 222 626 250Z" fill="#2a4a55"/>`,
    suv: `<path d="M120 300 Q122 240 176 232 L260 226 Q300 180 380 176 L560 176 Q640 182 680 232 L740 244 Q768 252 772 290 L772 320 L120 320Z" fill="#10252b"/><path d="M290 226 Q322 192 384 188 L556 188 Q612 194 646 228Z" fill="#315d68"/>`,
    van: `<path d="M110 300 L116 214 Q120 184 158 180 L560 172 Q640 174 690 226 L756 250 Q780 260 782 290 L782 320 L110 320Z" fill="#10252b"/><path d="M140 206 L560 198 Q620 202 656 232 L140 232Z" fill="#315d68"/><path d="M360 196 V232 M470 196 V232" stroke="#10252b" stroke-width="6"/>`,
    minivan: `<path d="M110 300 Q116 226 160 214 L260 208 Q310 170 400 168 L560 168 Q650 174 694 232 L752 252 Q780 260 782 290 L782 320 L110 320Z" fill="#14303a"/><path d="M290 208 Q330 184 404 182 L550 182 Q610 188 646 230 L290 232Z" fill="#3a6b78"/>`,
    group: `<path d="M80 300 L84 190 Q88 158 130 156 L620 150 Q700 152 730 196 L800 236 Q824 248 826 290 L826 320 L80 320Z" fill="#10252b"/><path d="M110 184 L640 178 Q690 182 712 210 L110 218Z" fill="#315d68"/><path d="M230 180 V218 M350 180 V218 M470 180 V218 M580 178 V218" stroke="#10252b" stroke-width="6"/>`,
  };
  const wheels = `<circle cx="270" cy="322" r="40" fill="#05090b"/><circle cx="270" cy="322" r="18" fill="#2b3a40"/><circle cx="650" cy="322" r="40" fill="#05090b"/><circle cx="650" cy="322" r="18" fill="#2b3a40"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 500" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1ebdd"/><stop offset="1" stop-color="#d8c8aa"/></linearGradient></defs><rect width="900" height="500" fill="url(#b)"/><ellipse cx="450" cy="372" rx="360" ry="16" fill="#10252b" opacity=".18"/>${bodies[kind]}${wheels}</svg>`;
}

const sky = (a, b, c) =>
  `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".6" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#sky)"/>`;

const GOLD = ["#31596a", "#e8b98a", "#f6dcb4"];
const DAY = ["#6aa3b8", "#bcd9de", "#eef0e6"];
const DUSK = ["#1d3440", "#a76f5c", "#f0b987"];
const NIGHT = ["#0c1a20", "#1d3a46", "#4b6a73"];

const scenes = {
  hero: () => sky(...GOLD) + sun(1150, 520, 70, "#fff0cf") + ridge(560, 90, "#4d6a73", 0.55) + ridge(610, 70, "#365660", 0.75) + sea(640, "#4b8497", "#1f4a5a") + cubes(80, 700, 6, 1.2) + ridge(760, 60, "#2a3d3a") + `<path d="M0 ${H} L0 800 Q700 760 ${W} 830 L${W} ${H}Z" fill="#26343a"/><path d="M0 880 Q700 840 ${W} 910" stroke="#e9dfc6" stroke-width="3" stroke-dasharray="40 30" fill="none" opacity=".6"/>` + car(520, 800, 1.1),
  chauffeur: () => sky(...DUSK) + sun(1250, 480, 60, "#ffe2b0") + ridge(600, 90, "#3a4f5a", 0.7) + `<rect y="700" width="${W}" height="300" fill="#202e34"/>` + car(380, 640, 1.9) + `<rect x="1020" y="330" width="130" height="430" fill="#f7f4ee" opacity=".88"/><circle cx="1085" cy="300" r="46" fill="#10252b"/><rect x="1040" y="350" width="90" height="300" rx="30" fill="#10252b"/>`,
  airport: () => sky(...DAY) + sun(300, 220, 50, "#fff7dd") + plane(900, 300) + ridge(720, 70, "#7d9aa0", 0.6) + `<rect y="760" width="${W}" height="240" fill="#cfd5d0"/><rect y="840" width="${W}" height="6" fill="#fff" opacity=".6"/>` + car(520, 800, 1.2),
  piraeus: () => sky(...DUSK) + sun(300, 540, 60, "#ffe2b0") + ridge(650, 80, "#3d5560", 0.8) + sea(680, "#406f80", "#173440") + ship(540, 640, 2.4) + cubes(60, 700, 5, 0.9),
  athens: () => sky(...GOLD) + sun(1250, 400, 70, "#fff0cf") + ridge(700, 100, "#5d7378", 0.6) + `<path d="M380 780 Q700 540 1220 780Z" fill="#8f8671"/>` + columns(640, 640, 6, 130) + cubes(0, 900, 22, 1.1) + `<rect y="900" width="${W}" height="100" fill="#d9cdb4"/>`,
  sounion: () => sky(...DUSK) + sun(1050, 470, 85, "#ffe2b0") + sea(520, "#3d6c80", "#12303b") + `<path d="M0 ${H} L0 700 Q300 640 700 640 L900 640 Q1100 800 1250 ${H}Z" fill="#6f6650"/>` + columns(500, 640, 6, 170, "#f2eadb"),
  delphi: () => sky(...DAY) + sun(250, 200, 45, "#fff7dd") + ridge(450, 180, "#6f8b84", 0.9) + ridge(600, 140, "#506e66") + ridge(760, 90, "#385249") + columns(980, 800, 4, 120, "#eadfc8") + `<path d="M0 ${H} L0 860 Q800 820 ${W} 880 L${W} ${H}Z" fill="#6a6247"/>`,
  meteora: () => sky(...GOLD) + sun(250, 360, 60, "#fff0cf") + ridge(700, 80, "#7a8a86", 0.5) + rocks() + `<rect x="260" y="360" width="80" height="40" fill="#d8c8aa"/><rect x="1020" y="320" width="90" height="42" fill="#d8c8aa"/>`,
  nafplio: () => sky(...GOLD) + sun(1200, 450, 65, "#fff0cf") + ridge(430, 130, "#59706f", 0.9) + `<path d="M0 560 Q500 420 900 470 L1000 560Z" fill="#7b7258"/><rect x="560" y="440" width="200" height="40" fill="#cdbf9f"/>` + sea(620, "#4b8497", "#1f4a5a") + cubes(40, 780, 14, 1.0) + `<rect y="880" width="${W}" height="120" fill="#d9cdb4"/>`,
  mykonos: () => sky(...DAY) + sun(1250, 230, 55, "#fff7dd") + sea(520, "#3f93b5", "#17566f") + `<path d="M0 ${H} L0 640 Q500 560 1000 640 Q1300 690 ${W} 620 L${W} ${H}Z" fill="#efe7d6"/>` + cubes(120, 780, 14, 1.4) + windmill(300, 640) + windmill(520, 660),
  santorini: () => sky(...DAY) + sun(260, 210, 55, "#fff7dd") + sea(430, "#2f7aa6", "#0f3d5c") + `<path d="M0 ${H} L0 520 Q500 460 1100 620 Q1400 700 ${W} 760 L${W} ${H}Z" fill="#e9dcc7"/>` + cubes(300, 760, 12, 1.5) + dome(640, 700, 60) + dome(900, 760, 50),
  crete: () => sky(...DAY) + sun(1200, 190, 55, "#fff7dd") + ridge(430, 200, "#8d9f91", 0.9) + ridge(570, 120, "#6a8374") + sea(660, "#3d93a8", "#14566a") + `<path d="M0 ${H} L0 880 Q800 840 ${W} 900 L${W} ${H}Z" fill="#d9c9a1"/>`,
  coast: () => sky(...GOLD) + sun(380, 560, 65, "#fff0cf") + ridge(560, 110, "#4d6a73", 0.6) + sea(600, "#4b8497", "#1f4a5a") + `<path d="M0 ${H} L0 760 Q700 700 ${W} 820 L${W} ${H}Z" fill="#26343a"/><path d="M0 880 Q700 810 ${W} 930" stroke="#e9dfc6" stroke-width="3" stroke-dasharray="40 30" fill="none" opacity=".55"/>` + car(860, 780, 0.9),
  business: () => sky(...DUSK) + sun(260, 560, 50, "#ffe2b0") + Array.from({ length: 9 }, (_, i) => `<rect x="${120 + i * 160}" y="${360 + (i % 3) * 70}" width="110" height="${640}" fill="#1b3039" opacity=".9"/>${Array.from({ length: 8 }, (_, j) => `<rect x="${136 + i * 160}" y="${400 + (i % 3) * 70 + j * 60}" width="14" height="22" fill="#f5d9a0" opacity="${0.15 + rnd() * 0.5}"/>`).join("")}`).join("") + `<rect y="820" width="${W}" height="180" fill="#121f25"/>` + car(640, 780, 1.1),
  interior: () => sky(...NIGHT) + `<rect y="640" width="${W}" height="360" fill="#14262d"/><path d="M200 640 Q400 380 800 380 Q1200 380 1400 640Z" fill="#1d3a46"/><rect x="260" y="560" width="1080" height="160" rx="60" fill="#d8c8aa"/><rect x="260" y="560" width="1080" height="40" rx="20" fill="#a88b62" opacity=".5"/>`,
};

for (const [name, fn] of Object.entries(scenes)) {
  seed = 11 + name.length * 13;
  writeFileSync(new URL(`${name}.svg`, OUT), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${fn()}</svg>`);
}
for (const k of ["sedan", "premium", "suv", "van", "minivan", "group"]) writeFileSync(new URL(`v-${k}.svg`, OUT), vehicle(k));
// Descriptive filenames for service-page heroes (image SEO). Same art, SEO-friendly names.
const ALIASES = {
  "greece-private-airport-transfer-athens": "airport",
  "greece-private-cruise-port-transfer-piraeus": "piraeus",
  "greece-private-chauffeur-service-athens": "chauffeur",
  "greece-private-intercity-transfer-peloponnese": "nafplio",
  "greece-private-chauffeur-tour-delphi": "delphi",
  "greece-corporate-executive-chauffeur-athens": "business",
};
for (const [alias, key] of Object.entries(ALIASES)) {
  seed = 11 + key.length * 13;
  writeFileSync(new URL(`${alias}.svg`, OUT), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${scenes[key]()}</svg>`);
}
console.log("wrote", Object.keys(scenes).length + 6, "placeholder images");
