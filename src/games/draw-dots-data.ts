/**
 * Dot-to-dot pictures: numbered dots (in the 200×200 art space) that trace
 * the outline of a little drawing. When the last dot is joined, the drawing
 * appears and becomes a coloring page.
 */

const O = "#2b2b3a";
const W = "#ffffff";
const GLASS = "#9fe3ff";

const svg = (inner: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none" stroke="${O}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">${inner}</svg>`;

const eye = (cx: number, cy: number, r: number): string =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${W}" stroke-width="4"/>` +
  `<circle cx="${cx + r * 0.2}" cy="${cy + r * 0.08}" r="${r * 0.58}" fill="${O}" stroke="none"/>` +
  `<circle cx="${cx + r * 0.36}" cy="${cy - r * 0.2}" r="${r * 0.22}" fill="${W}" stroke="none"/>`;

const wheel = (cx: number, cy: number, r: number): string =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#3b3b4f"/><circle cx="${cx}" cy="${cy}" r="${Math.round(r * 0.45)}" fill="#d5d8e0" stroke-width="4"/>`;

export interface DotPic {
  id: string;
  /** "star" — used in "It's a star!" and "Let's color the star!". */
  name: string;
  dots: [number, number][];
  art: string;
}

const round = (p: [number, number][]) => p.map(([x, y]) => [Math.round(x), Math.round(y)] as [number, number]);

// A star: 10 dots, outer and inner points.
const starDots = round(
  Array.from({ length: 10 }, (_, i) => {
    const a = (-90 + i * 36) * (Math.PI / 180);
    const r = i % 2 ? 36 : 84;
    return [100 + Math.cos(a) * r, 108 + Math.sin(a) * r] as [number, number];
  }),
);

// A heart: 10 dots along the classic heart curve.
const heartDots = round(
  Array.from({ length: 10 }, (_, i) => {
    const t = (i / 10) * Math.PI * 2;
    const x = 16 * Math.sin(t) ** 3;
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return [100 + x * 5.2, 94 - y * 5.2] as [number, number];
  }),
);

const poly = (pts: [number, number][]) => "M" + pts.map(([x, y]) => `${x} ${y}`).join("L") + "z";

export const DOT_PICS: DotPic[] = [
  {
    id: "star",
    name: "star",
    dots: starDots,
    art: svg(
      `<path d="${poly(starDots)}" fill="#ffd740" stroke-width="7"/>` +
        eye(86, 106, 9) +
        eye(114, 106, 9) +
        `<path d="M90 124q10 10 20 0" stroke-width="5"/>` +
        `<circle cx="76" cy="122" r="5" fill="#ff8a80" stroke="none" opacity=".8"/><circle cx="124" cy="122" r="5" fill="#ff8a80" stroke="none" opacity=".8"/>`,
    ),
  },
  {
    id: "heart",
    name: "heart",
    dots: heartDots,
    art: svg(
      `<path d="M100 66C92 42 66 34 46 44C20 58 20 96 44 122C62 142 84 158 100 180C116 158 138 142 156 122C180 96 180 58 154 44C134 34 108 42 100 66z" fill="#ff5277" stroke-width="7"/>` +
        `<path d="M58 62q-12 6-12 22" stroke="${W}" stroke-width="7" opacity=".7"/>` +
        `<path d="M132 70l4 8 8 1-6 6 2 8-8-4-8 4 2-8-6-6 8-1z" fill="#fff59d" stroke-width="3"/>`,
    ),
  },
  {
    id: "house",
    name: "house",
    dots: [
      [36, 182],
      [36, 98],
      [20, 98],
      [100, 26],
      [134, 56],
      [134, 34],
      [158, 34],
      [158, 78],
      [180, 98],
      [164, 98],
      [164, 182],
    ],
    art: svg(
      `<circle cx="150" cy="20" r="8" fill="#eceff1" stroke-width="4"/>` +
        `<rect x="134" y="34" width="24" height="44" fill="#8d6e63"/>` +
        `<rect x="36" y="94" width="128" height="88" fill="#ffcc80"/>` +
        `<path d="M20 98L100 26l80 72z" fill="#e53935"/>` +
        `<path d="M86 182v-44q0-8 8-8h12q8 0 8 8v44z" fill="#8d5a2b"/>` +
        `<circle cx="106" cy="158" r="3" fill="${O}" stroke="none"/>` +
        `<rect x="48" y="112" width="28" height="26" rx="3" fill="${GLASS}" stroke-width="5"/><rect x="124" y="112" width="28" height="26" rx="3" fill="${GLASS}" stroke-width="5"/>` +
        `<path d="M62 112v26M48 125h28M138 112v26M124 125h28" stroke-width="3"/>` +
        `<circle cx="100" cy="70" r="11" fill="${GLASS}" stroke-width="5"/>`,
    ),
  },
  {
    id: "fish",
    name: "fish",
    dots: [
      [184, 100],
      [150, 64],
      [104, 54],
      [66, 72],
      [44, 94],
      [14, 62],
      [14, 138],
      [44, 106],
      [66, 128],
      [104, 146],
      [150, 136],
    ],
    art: svg(
      `<path d="M48 100L14 62q-6 38 0 76z" fill="#ff7043"/>` +
        `<path d="M184 100q-22-44-80-46q-44 0-60 46q16 46 60 46q58-2 80-46z" fill="#ffa726"/>` +
        `<path d="M98 56q14-26 36-20q-4 14-12 24" fill="#ff7043"/>` +
        `<path d="M96 70q-14 30 0 60M120 64q-12 36 0 72" stroke="#ff7043" stroke-width="6"/>` +
        `<path d="M110 120q18 2 22 16q-16 4-24-6" fill="#ff7043" stroke-width="5"/>` +
        eye(152, 90, 10) +
        `<path d="M168 112q6 2 10-2" stroke-width="4"/>` +
        `<circle cx="184" cy="56" r="6" fill="${W}" stroke-width="3"/><circle cx="174" cy="36" r="4" fill="${W}" stroke-width="3"/>`,
    ),
  },
  {
    id: "boat",
    name: "boat",
    dots: [
      [100, 18],
      [134, 66],
      [158, 118],
      [182, 124],
      [160, 166],
      [100, 170],
      [40, 166],
      [18, 124],
      [94, 124],
    ],
    art: svg(
      `<path d="M100 18v106" stroke-width="6"/>` +
        `<path d="M100 18l14-2v14l-14-2" fill="#ff5252" stroke-width="4"/>` +
        `<path d="M106 26q44 40 52 92h-52z" fill="${W}"/>` +
        `<path d="M94 34q-30 40-40 84h40z" fill="#ffd740"/>` +
        `<path d="M18 124h164q-6 40-26 44H44q-20-4-26-44z" fill="#e53935"/>` +
        `<circle cx="62" cy="144" r="7" fill="${GLASS}" stroke-width="4"/><circle cx="100" cy="144" r="7" fill="${GLASS}" stroke-width="4"/><circle cx="138" cy="144" r="7" fill="${GLASS}" stroke-width="4"/>` +
        `<path d="M6 186q16-10 32 0t32 0t32 0t32 0t32 0t32 0" stroke="#4fc3f7" stroke-width="6"/>`,
    ),
  },
  {
    id: "rocket",
    name: "rocket",
    dots: [
      [100, 14],
      [126, 48],
      [130, 120],
      [156, 150],
      [156, 172],
      [126, 158],
      [74, 158],
      [44, 172],
      [44, 150],
      [70, 120],
      [74, 48],
    ],
    art: svg(
      `<path d="M80 158h40q-4 22-20 36q-16-14-20-36z" fill="#ffb300"/>` +
        `<path d="M72 116l-28 34v22l30-14zM128 116l28 34v22l-30-14z" fill="#e53935"/>` +
        `<path d="M100 14q30 26 30 84v60H70V98q0-58 30-84z" fill="#eceff1"/>` +
        `<path d="M100 14q20 16 26 40H74q6-24 26-40z" fill="#e53935"/>` +
        `<circle cx="100" cy="92" r="16" fill="${GLASS}"/>` +
        `<path d="M70 134h60" stroke-width="5"/>`,
    ),
  },
  {
    id: "truck",
    name: "truck",
    dots: [
      [12, 150],
      [12, 64],
      [118, 64],
      [118, 88],
      [150, 88],
      [172, 116],
      [188, 122],
      [188, 150],
      [140, 150],
      [70, 150],
    ],
    art: svg(
      `<rect x="12" y="64" width="110" height="86" rx="6" fill="#4fc3f7"/>` +
        `<path d="M26 82h82M26 100h82" stroke="#29a8e0" stroke-width="5"/>` +
        `<path d="M118 150V96q0-8 8-8h22q6 0 10 6l14 22 10 4q6 2 6 10v20z" fill="#e53935"/>` +
        `<path d="M130 98h16l14 20h-30z" fill="${GLASS}" stroke-width="4"/>` +
        `<rect x="178" y="128" width="10" height="9" rx="3" fill="#fff59d" stroke-width="4"/>` +
        wheel(46, 154, 20) +
        wheel(154, 154, 20),
    ),
  },
  {
    id: "dino",
    name: "dinosaur",
    dots: [
      [8, 150],
      [40, 118],
      [80, 96],
      [118, 100],
      [138, 60],
      [156, 34],
      [184, 32],
      [186, 50],
      [162, 56],
      [150, 110],
      [148, 176],
      [124, 176],
      [118, 150],
      [70, 150],
      [64, 176],
    ],
    art: svg(
      `<path d="M8 150q30-26 60-50q30-10 56-2q10-36 30-58q12-10 28-6q8 10 2 18q-8 4-18 4q-12 10-12 30l-4 48q-4 16-20 16H70q-30 0-62 0z" fill="#9ccc65"/>` +
        `<rect x="124" y="138" width="24" height="38" rx="9" fill="#9ccc65"/>` +
        `<rect x="42" y="140" width="24" height="36" rx="9" fill="#7cb342"/>` +
        `<rect x="64" y="140" width="24" height="36" rx="9" fill="#9ccc65"/>` +
        `<rect x="102" y="138" width="22" height="38" rx="9" fill="#7cb342"/>` +
        `<circle cx="80" cy="118" r="7" fill="#dcedc8" stroke-width="4"/><circle cx="104" cy="112" r="8" fill="#dcedc8" stroke-width="4"/><circle cx="62" cy="128" r="5" fill="#dcedc8" stroke-width="4"/>` +
        eye(168, 38, 7),
    ),
  },
];
