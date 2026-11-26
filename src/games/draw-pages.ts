/**
 * More coloring-page art for the Drawing studio, in the same chunky cartoon
 * style as src/art/art.ts (viewBox 0 0 200 200, dark #2b2b3a outlines,
 * vehicles face right). The colors here are only for the picker thumbnails:
 * the coloring page turns every shape white and tappable.
 */

const O = "#2b2b3a";
const TIRE = "#3b3b4f";
const HUB = "#d5d8e0";
const GLASS = "#9fe3ff";
const YEL = "#ffc61a";
const YEL_D = "#f29f05";
const RED = "#e53935";
const W = "#ffffff";
const SKY = "#c8ecff";
const GRASS = "#8bc34a";

const svg = (inner: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none" stroke="${O}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">${inner}</svg>`;

const wheel = (cx: number, cy: number, r: number): string =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${TIRE}"/><circle cx="${cx}" cy="${cy}" r="${Math.round(r * 0.45)}" fill="${HUB}" stroke-width="4"/>`;

const shine = (x: number, y: number, rx: number, ry: number): string =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${W}" stroke="none" opacity=".75"/>`;

const eye = (cx: number, cy: number, r: number): string =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${W}" stroke-width="4"/>` +
  `<circle cx="${cx + r * 0.22}" cy="${cy + r * 0.05}" r="${r * 0.58}" fill="${O}" stroke="none"/>` +
  `<circle cx="${cx + r * 0.38}" cy="${cy - r * 0.22}" r="${r * 0.22}" fill="${W}" stroke="none"/>`;

const bar = (d: string, color: string, w: number): string => `<path d="${d}" stroke-width="${w + 12}"/><path d="${d}" stroke="${color}" stroke-width="${w}"/>`;

/** Fluffy cloud (three bumps on a flat bottom). */
const cloud = (x: number, y: number, s: number): string =>
  `<path d="M${x} ${y}h${44 * s}q${8 * s} 0 ${8 * s}-${9 * s}q0-${10 * s}-${11 * s}-${10 * s}q-${2 * s}-${14 * s}-${16 * s}-${14 * s}q-${10 * s} 0-${15 * s} ${8 * s}q-${16 * s}-${2 * s}-${18 * s} ${12 * s}q-${8 * s} 1-${8 * s} ${7 * s}q0 ${6 * s} ${8 * s} ${6 * s}z" fill="${W}" stroke-width="5"/>`;

const sunRays = (cx: number, cy: number, r: number, k = 8): string => {
  let d = "";
  for (let i = 0; i < k; i++) {
    const a = (i / k) * Math.PI * 2 + 0.2;
    const r1 = r + 6;
    const r2 = r + 16;
    d += `M${(cx + Math.cos(a) * r1).toFixed(1)} ${(cy + Math.sin(a) * r1).toFixed(1)}L${(cx + Math.cos(a) * r2).toFixed(1)} ${(cy + Math.sin(a) * r2).toFixed(1)}`;
  }
  return `<path d="${d}" stroke-width="5"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffd740"/>`;
};

/** Circle with a scalloped (bumpy) edge. */
const scallop = (cx: number, cy: number, r: number, k: number, fill: string): string => {
  let d = "";
  for (let i = 0; i <= k; i++) {
    const a = (i / k) * Math.PI * 2;
    const x = (cx + r * Math.cos(a)).toFixed(1);
    const y = (cy + r * Math.sin(a)).toFixed(1);
    d += i === 0 ? `M${x} ${y}` : `A${(r * 0.3).toFixed(1)} ${(r * 0.3).toFixed(1)} 0 0 1 ${x} ${y}`;
  }
  return `<path d="${d}z" fill="${fill}"/>`;
};

// ---------------------------------------------------------------------------
// Trucks & things that go

const firetruck = svg(
  `<rect x="10" y="140" width="178" height="16" rx="6" fill="#55576b"/>` +
    // ladder on top
    `<rect x="18" y="70" width="112" height="14" rx="5" fill="#cfd8dc"/>` +
    `<path d="M38 70v14M58 70v14M78 70v14M98 70v14" stroke-width="4"/>` +
    // body box
    `<rect x="12" y="90" width="124" height="58" rx="8" fill="${RED}"/>` +
    `<rect x="24" y="100" width="34" height="26" rx="4" fill="#ef9a9a"/>` +
    `<rect x="66" y="100" width="34" height="26" rx="4" fill="#ef9a9a"/>` +
    `<circle cx="118" cy="112" r="10" fill="#ffd54f"/>` +
    `<path d="M14 134h120" stroke="${W}" stroke-width="6" opacity=".8"/>` +
    // cab
    `<path d="M130 148V86q0-8 8-8h24q9 0 13 10l11 34v26z" fill="${RED}"/>` +
    `<path d="M140 88h20l9 28h-29z" fill="${GLASS}" stroke-width="4"/>` +
    `<rect x="140" y="64" width="26" height="12" rx="5" fill="#42a5f5"/>` +
    `<rect x="178" y="128" width="9" height="10" rx="3" fill="#fff59d" stroke-width="4"/>` +
    shine(146, 98, 3, 6) +
    wheel(42, 160, 20) +
    wheel(92, 160, 20) +
    wheel(158, 160, 20),
);

const CAR = "M14 150v-26q0-14 16-16l24-2 22-30q6-8 16-8h30q10 0 18 8l26 30 14 2q16 4 16 20v22z";
const police = svg(
  // light bar
  `<rect x="78" y="56" width="20" height="12" rx="4" fill="#ff5252"/>` +
    `<rect x="98" y="56" width="20" height="12" rx="4" fill="#448aff"/>` +
    `<path d="M98 68v-4" stroke-width="6"/>` +
    `<path d="${CAR}" fill="#283593"/>` +
    `<path d="M62 108h88l2 34H58z" fill="${W}" stroke-width="5"/>` +
    `<path d="M64 106l18-24q4-4 10-4h12v28z" fill="${GLASS}" stroke-width="4"/>` +
    `<path d="M114 78h8q6 0 10 4l20 24h-38z" fill="${GLASS}" stroke-width="4"/>` +
    `<path d="M108 108v34" stroke-width="5"/>` +
    // star badge
    `<path d="M84 114l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="#ffd740" stroke-width="3"/>` +
    `<rect x="176" y="118" width="12" height="10" rx="4" fill="#fff59d" stroke-width="4"/>` +
    shine(76, 90, 3, 6) +
    wheel(54, 152, 22) +
    wheel(150, 152, 22),
);

const bus = svg(
  `<rect x="8" y="66" width="182" height="88" rx="14" fill="${YEL}"/>` +
    `<rect x="18" y="78" width="26" height="26" rx="4" fill="${GLASS}" stroke-width="4"/>` +
    `<rect x="52" y="78" width="26" height="26" rx="4" fill="${GLASS}" stroke-width="4"/>` +
    `<rect x="86" y="78" width="26" height="26" rx="4" fill="${GLASS}" stroke-width="4"/>` +
    `<rect x="124" y="78" width="22" height="58" rx="3" fill="${GLASS}" stroke-width="4"/>` +
    `<path d="M135 78v58" stroke-width="4"/>` +
    `<path d="M156 78h16q10 0 12 10v20h-28z" fill="${GLASS}" stroke-width="4"/>` +
    `<path d="M10 118h112M148 118h40" stroke-width="5"/>` +
    `<rect x="176" y="126" width="10" height="10" rx="3" fill="#fff59d" stroke-width="4"/>` +
    `<path d="M2 96h8v16H2z" fill="#ff5252" stroke-width="4"/>` +
    shine(30, 88, 3, 6) +
    wheel(46, 158, 20) +
    wheel(154, 158, 20),
);

const train = svg(
  // smoke
  `<circle cx="146" cy="40" r="9" fill="#eceff1" stroke-width="4"/><circle cx="164" cy="24" r="12" fill="#eceff1" stroke-width="4"/>` +
    // rails
    `<path d="M4 184h192" stroke-width="5"/>` +
    // chimney + dome (behind boiler)
    `<path d="M128 96V70h-6V58h30v12h-6v26z" fill="#455a64"/>` +
    `<circle cx="100" cy="94" r="12" fill="${YEL}"/>` +
    // boiler
    `<rect x="62" y="92" width="104" height="52" rx="22" fill="${RED}"/>` +
    `<path d="M86 94v48M110 94v48" stroke-width="4"/>` +
    // front
    `<path d="M162 140l26 26h-26z" fill="${YEL}"/>` +
    `<circle cx="168" cy="110" r="8" fill="#fff59d" stroke-width="4"/>` +
    // cab
    `<rect x="16" y="66" width="52" height="82" rx="6" fill="#1e88e5"/>` +
    `<rect x="10" y="54" width="64" height="14" rx="5" fill="#455a64"/>` +
    `<rect x="26" y="78" width="30" height="26" rx="4" fill="${GLASS}" stroke-width="4"/>` +
    `<rect x="10" y="146" width="160" height="12" rx="4" fill="#55576b"/>` +
    shine(34, 88, 3, 6) +
    shine(92, 104, 16, 4) +
    wheel(42, 162, 20) +
    wheel(96, 166, 16) +
    wheel(138, 166, 16),
);

const airplane = svg(
  cloud(18, 168, 0.9) +
    cloud(132, 46, 0.9) +
    // far wing
    `<path d="M98 98l20-30h18l-8 30z" fill="#ef9a9a"/>` +
    // tail
    `<path d="M30 102L18 62h18l30 40z" fill="#ef5350"/>` +
    // body
    `<path d="M26 102h118q32 0 46 18q-14 18-46 18H44q-18 0-18-18z" fill="#42a5f5"/>` +
    `<path d="M160 104q16 4 26 14h-28z" fill="${GLASS}" stroke-width="4"/>` +
    `<circle cx="70" cy="114" r="7" fill="${GLASS}" stroke-width="4"/><circle cx="94" cy="114" r="7" fill="${GLASS}" stroke-width="4"/><circle cx="118" cy="114" r="7" fill="${GLASS}" stroke-width="4"/>` +
    // near wing
    `<path d="M86 124h40l-26 46H80z" fill="#ef5350"/>` +
    shine(60, 106, 14, 3),
);

const helicopter = svg(
  // rotor
  `<rect x="34" y="40" width="148" height="10" rx="5" fill="#90a4ae"/>` +
    `<path d="M108 50v20" stroke-width="10"/>` +
    // tail
    `<path d="M66 108L18 94v16l50 18z" fill="#ffb300"/>` +
    `<circle cx="20" cy="100" r="13" fill="#eceff1" stroke-width="4"/><path d="M20 87v26M7 100h26" stroke-width="4"/>` +
    // skids
    `<path d="M80 150v14M140 150v14M64 166h96q10 0 14-8" stroke-width="7"/>` +
    // body
    `<path d="M60 120q0-46 50-46h20q40 0 46 38q4 30-26 36H86q-26 0-26-28z" fill="#ffb300"/>` +
    `<path d="M132 80q34 2 42 36h-42z" fill="${GLASS}" stroke-width="4"/>` +
    `<rect x="86" y="96" width="30" height="24" rx="5" fill="${GLASS}" stroke-width="4"/>` +
    shine(146, 94, 4, 8),
);

const rocket = svg(
  `<path d="M38 40l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="#ffd740" stroke-width="3"/>` +
    `<path d="M160 70l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="#ffd740" stroke-width="3"/>` +
    // flame
    `<path d="M78 150h44q-4 26-22 40q-18-14-22-40z" fill="#ffb300"/>` +
    `<path d="M88 152h24q-2 16-12 24q-10-8-12-24z" fill="#ff7043" stroke-width="4"/>` +
    // fins
    `<path d="M72 110l-26 34v20l28-14z" fill="${RED}"/>` +
    `<path d="M128 110l26 34v20l-28-14z" fill="${RED}"/>` +
    // body
    `<path d="M100 14q32 28 32 82v58H68V96q0-54 32-82z" fill="#eceff1"/>` +
    `<path d="M100 14q22 18 29 46H71q7-28 29-46z" fill="${RED}"/>` +
    `<circle cx="100" cy="94" r="17" fill="${GLASS}"/>` +
    `<path d="M68 132h64" stroke-width="5"/>` +
    shine(92, 86, 4, 6),
);

// ---------------------------------------------------------------------------
// Diggers & farm machines

const tractor = svg(
  // exhaust
  bar("M150 104V72", "#8a8fa0", 6) +
    // hood
    `<path d="M84 104h78q14 0 16 14v26H84z" fill="#43a047"/>` +
    `<path d="M150 112v28M160 112v28" stroke="#2e7d32" stroke-width="4"/>` +
    // cab
    `<rect x="30" y="54" width="72" height="12" rx="5" fill="${YEL}"/>` +
    `<path d="M38 144V66h58v78z" fill="#43a047"/>` +
    `<rect x="48" y="74" width="38" height="34" rx="4" fill="${GLASS}" stroke-width="4"/>` +
    `<rect x="26" y="140" width="156" height="10" rx="4" fill="#2e7d32"/>` +
    shine(58, 84, 3, 7) +
    // wheels: big back, small front
    `<circle cx="58" cy="152" r="36" fill="${TIRE}"/><circle cx="58" cy="152" r="17" fill="${YEL}" stroke-width="4"/><circle cx="58" cy="152" r="5" fill="${O}" stroke="none"/>` +
    `<circle cx="158" cy="164" r="22" fill="${TIRE}"/><circle cx="158" cy="164" r="10" fill="${YEL}" stroke-width="4"/>`,
);

const crane = svg(
  // boom + cable + hook
  bar("M74 112L168 30", YEL_D, 14) +
    `<path d="M168 32V100" stroke-width="3"/>` +
    `<rect x="158" y="98" width="20" height="14" rx="3" fill="#ff7043"/>` +
    `<path d="M168 112v10q0 10-9 10q-8 0-8-8" stroke-width="5"/>` +
    // operator house
    `<path d="M44 128V96q0-6 6-6h40l10 38z" fill="${YEL}"/>` +
    `<path d="M76 96h10l7 24H76z" fill="${GLASS}" stroke-width="4"/>` +
    `<circle cx="74" cy="112" r="6" fill="${HUB}" stroke-width="4"/>` +
    // carrier
    `<rect x="10" y="126" width="148" height="24" rx="6" fill="${YEL}"/>` +
    `<path d="M150 150V100q0-6 6-6h16q7 0 10 7l8 27v22z" fill="${YEL}"/>` +
    `<path d="M160 102h12l7 22h-19z" fill="${GLASS}" stroke-width="4"/>` +
    `<path d="M16 138h128" stroke="${YEL_D}" stroke-width="5"/>` +
    wheel(34, 158, 16) +
    wheel(72, 158, 16) +
    wheel(124, 158, 16) +
    wheel(170, 158, 16),
);

// ---------------------------------------------------------------------------
// Dinosaurs

const trex = svg(
  // tail + body
  `<path d="M8 104q36 4 62-14q26-18 52-10q14 6 16 30l4 30q-2 34-40 34q-30 0-48-20q-14-16-46-50z" fill="#66bb6a"/>` +
    // back spikes
    `<path d="M40 96l6-14 8 10M62 86l8-14 8 12M88 78l10-12 6 14" fill="#ffb74d" stroke-width="4"/>` +
    // belly
    `<path d="M104 96q26 6 30 40q-8 18-32 20q10-28 2-60z" fill="#fff59d" stroke-width="4"/>` +
    // back leg
    `<ellipse cx="84" cy="134" rx="26" ry="24" fill="#4caf50"/>` +
    `<path d="M76 152v24h-8q-8 0-8 6h40v-30z" fill="#4caf50"/>` +
    // arm
    `<path d="M128 104q16 0 18 12l-4 6-4-6q-8 0-10-6z" fill="#66bb6a" stroke-width="5"/>` +
    // head
    `<path d="M116 68q0-36 36-36h20q22 0 22 22v14q0 12-14 14h-30l-8 12q-16 8-24-6q-2-10-2-20z" fill="#66bb6a"/>` +
    `<path d="M152 82l4 7 4-7 4 7 4-7 4 7 4-7" fill="${W}" stroke-width="3"/>` +
    `<path d="M186 46v3" stroke-width="5"/>` +
    eye(150, 54, 10) +
    shine(60, 96, 10, 3),
);

const bronto = svg(
  // tail
  `<path d="M40 118Q10 116 4 150q22-2 44-18z" fill="#4fc3f7"/>` +
    // back legs
    `<rect x="40" y="132" width="24" height="46" rx="10" fill="#29a8e0"/>` +
    `<rect x="102" y="132" width="24" height="46" rx="10" fill="#29a8e0"/>` +
    // neck + head
    `<path d="M118 112q6-50 30-80q10-12 24-8q14 6 10 20q-4 10-16 10q-14 2-18 22q-6 20-8 44z" fill="#4fc3f7"/>` +
    // body
    `<ellipse cx="88" cy="118" rx="58" ry="36" fill="#4fc3f7"/>` +
    `<path d="M60 96q12-8 26-6M98 90q14 0 24 8" stroke="#29a8e0" stroke-width="5"/>` +
    // front legs
    `<rect x="56" y="140" width="24" height="42" rx="10" fill="#4fc3f7"/>` +
    `<rect x="116" y="138" width="24" height="42" rx="10" fill="#4fc3f7"/>` +
    // spots
    `<circle cx="72" cy="112" r="7" fill="#b3e5fc" stroke-width="4"/><circle cx="96" cy="124" r="9" fill="#b3e5fc" stroke-width="4"/><circle cx="116" cy="108" r="6" fill="#b3e5fc" stroke-width="4"/>` +
    eye(168, 34, 7) +
    `<path d="M172 46q6 2 10-2" stroke-width="4"/>` +
    shine(70, 96, 12, 3),
);

// ---------------------------------------------------------------------------
// Animals

const cow = svg(
  // tail
  `<path d="M30 98q-14 8-12 34" stroke-width="5"/><path d="M14 132q4-8 10 0q-2 8-10 0z" fill="#5d4037" stroke-width="4"/>` +
    // legs (back)
    `<rect x="44" y="132" width="18" height="44" rx="6" fill="${W}"/><rect x="118" y="132" width="18" height="44" rx="6" fill="${W}"/>` +
    `<path d="M44 166h18M118 166h18" stroke-width="5"/>` +
    // body
    `<rect x="26" y="82" width="128" height="64" rx="28" fill="${W}"/>` +
    `<path d="M48 84q14 8 6 26q-14 8-26-2" fill="#5d4037" stroke="none"/>` +
    `<path d="M98 100q16-8 26 4q4 16-12 20q-18 0-14-24z" fill="#5d4037" stroke="none"/>` +
    `<ellipse cx="66" cy="140" rx="10" ry="6" fill="#f8bbd0" stroke-width="4"/>` +
    // front legs
    `<rect x="62" y="136" width="18" height="44" rx="6" fill="${W}"/><rect x="100" y="136" width="18" height="44" rx="6" fill="${W}"/>` +
    `<path d="M62 170h18M100 170h18" stroke-width="5"/>` +
    // head
    `<path d="M140 54q-8-8-2-14q10 0 12 10M176 50q6-10 14-6q2 8-8 12" fill="${YEL}" stroke-width="4"/>` +
    `<path d="M136 66q-12-2-16 8q8 6 18 2zM182 66q12-2 16 8q-8 6-18 2z" fill="${W}" stroke-width="4"/>` +
    `<rect x="134" y="48" width="52" height="66" rx="24" fill="${W}"/>` +
    `<ellipse cx="160" cy="104" rx="26" ry="16" fill="#f8bbd0"/>` +
    `<ellipse cx="151" cy="104" rx="3" ry="4" fill="${O}" stroke="none"/><ellipse cx="169" cy="104" rx="3" ry="4" fill="${O}" stroke="none"/>` +
    eye(148, 76, 7) +
    eye(170, 76, 7),
);

const pig = svg(
  `<path d="M30 104q-16-4-14-16q8-6 12 4q2 10-10 14" stroke-width="5"/>` +
    // back legs
    `<rect x="46" y="136" width="20" height="36" rx="8" fill="#f48fb1"/><rect x="112" y="136" width="20" height="36" rx="8" fill="#f48fb1"/>` +
    // body
    `<ellipse cx="88" cy="116" rx="62" ry="42" fill="#f8a5c2"/>` +
    // front legs
    `<rect x="64" y="140" width="20" height="36" rx="8" fill="#f8a5c2"/><rect x="128" y="140" width="20" height="36" rx="8" fill="#f8a5c2"/>` +
    // head
    `<path d="M134 64l-6-24 22 14M172 64l10-22 6 26" fill="#f48fb1"/>` +
    `<circle cx="156" cy="92" r="34" fill="#f8a5c2"/>` +
    `<ellipse cx="174" cy="104" rx="18" ry="14" fill="#f48fb1"/>` +
    `<ellipse cx="168" cy="104" rx="3" ry="5" fill="${O}" stroke="none"/><ellipse cx="180" cy="104" rx="3" ry="5" fill="${O}" stroke="none"/>` +
    eye(146, 82, 7) +
    eye(166, 78, 6) +
    `<path d="M138 116q8 6 16 2" stroke-width="4"/>` +
    shine(66, 92, 14, 4),
);

const lion = svg(
  // body behind the head
  `<ellipse cx="100" cy="168" rx="54" ry="26" fill="${YEL}"/>` +
    `<path d="M62 176v16h18v-14M120 178v14h18v-16" fill="${YEL}"/>` +
    scallop(100, 92, 72, 14, "#fb8c00") +
    `<circle cx="52" cy="50" r="13" fill="${YEL}"/><circle cx="148" cy="50" r="13" fill="${YEL}"/>` +
    `<circle cx="100" cy="94" r="48" fill="${YEL}"/>` +
    `<ellipse cx="88" cy="118" rx="16" ry="12" fill="${W}" stroke-width="4"/><ellipse cx="112" cy="118" rx="16" ry="12" fill="${W}" stroke-width="4"/>` +
    `<path d="M90 102h20l-10 12z" fill="#8d5a2b" stroke-width="4"/>` +
    `<path d="M100 114v8M90 128q10 6 20 0" stroke-width="4"/>` +
    eye(80, 82, 9) +
    eye(120, 82, 9) +
    `<circle cx="82" cy="120" r="2" fill="${O}" stroke="none"/><circle cx="118" cy="120" r="2" fill="${O}" stroke="none"/>`,
);

const elephant = svg(
  `<path d="M28 104q-14 6-12 22" stroke-width="5"/>` +
    // back legs
    `<rect x="40" y="136" width="26" height="42" rx="8" fill="#78909c"/><rect x="100" y="136" width="26" height="42" rx="8" fill="#78909c"/>` +
    // body
    `<ellipse cx="80" cy="112" rx="58" ry="44" fill="#90a4ae"/>` +
    // front legs
    `<rect x="58" y="140" width="26" height="42" rx="8" fill="#90a4ae"/><rect x="118" y="138" width="26" height="42" rx="8" fill="#90a4ae"/>` +
    // trunk
    `<path d="M160 104q18 12 18 42q0 10 8 12q-2 10-14 6q-12-4-12-18q0-22-14-30z" fill="#90a4ae"/>` +
    // head
    `<circle cx="146" cy="84" r="34" fill="#90a4ae"/>` +
    // ear
    `<path d="M128 62q-34-6-38 28q-2 30 28 34q16-8 16-32q0-20-6-30z" fill="#b0bec5"/>` +
    `<path d="M122 74q-20 0-22 18q0 16 16 20q8-6 8-20t-2-18z" fill="#f8bbd0" stroke-width="4"/>` +
    // tusk
    `<path d="M158 110q6 12 18 10q-6-8-12-14z" fill="${W}" stroke-width="4"/>` +
    eye(156, 76, 7) +
    shine(56, 92, 14, 4),
);

const whale = svg(
  // spout
  `<path d="M112 46q-2-14-14-20M118 46q0-16 8-24M124 48q10-10 22-8" stroke="#4fc3f7" stroke-width="6"/>` +
    // tail
    `<path d="M40 112Q22 98 12 70q16 2 26 16q4-18 24-22q-2 26-16 48z" fill="#1e88e5"/>` +
    // body
    `<path d="M30 118q0-60 80-60q52 0 74 44q8 18-10 30q-28 22-78 22q-66 0-66-36z" fill="#1e88e5"/>` +
    `<path d="M60 146q50 16 112-14q-14 22-58 26q-34 2-54-12z" fill="#bbdefb" stroke-width="5"/>` +
    `<path d="M96 132q10 12 26 4l-10-16z" fill="#1565c0" stroke-width="5"/>` +
    eye(150, 100, 8) +
    `<path d="M160 120q10 4 18-4" stroke-width="4"/>` +
    shine(84, 76, 16, 4) +
    `<path d="M6 186q16-10 32 0t32 0t32 0t32 0t32 0t32 0" stroke="#4fc3f7" stroke-width="6"/>`,
);

// ---------------------------------------------------------------------------
// Scenes

const frame = (fill = SKY) => `<rect x="4" y="4" width="192" height="192" rx="18" fill="${fill}"/>`;

const farm = svg(
  frame() +
    sunRays(40, 40, 16) +
    cloud(120, 46, 0.8) +
    // hills
    `<path d="M5 132q50-30 100-6q46-20 90 4v62q0 4-4 4H9q-4 0-4-4z" fill="${GRASS}"/>` +
    `<path d="M5 168q60-18 120-2t70-4v28q0 4-4 4H9q-4 0-4-4z" fill="#aed581"/>` +
    // barn
    `<path d="M70 162V104l36-24 36 24v58z" fill="${RED}"/>` +
    `<path d="M60 108l46-34 46 34" stroke-width="12"/><path d="M60 108l46-34 46 34" stroke="#8d6e63" stroke-width="5"/>` +
    `<rect x="92" y="126" width="28" height="36" fill="${W}"/><path d="M92 126l28 36M120 126l-28 36" stroke-width="4"/>` +
    `<circle cx="106" cy="104" r="9" fill="${W}" stroke-width="4"/>` +
    // tree
    `<rect x="22" y="128" width="12" height="34" rx="3" fill="#8d5a2b"/>` +
    `<circle cx="28" cy="116" r="20" fill="#43a047"/>` +
    // fence
    `<path d="M150 150v-22M166 152v-22M182 150v-22M146 136h40M146 146h40" stroke-width="5"/>` +
    `<circle cx="20" cy="178" r="5" fill="#ff5252" stroke-width="3"/><circle cx="46" cy="182" r="5" fill="#ffd740" stroke-width="3"/>`,
);

const site = svg(
  frame() +
    sunRays(160, 38, 14) +
    // ground
    `<path d="M5 150h190v42q0 4-4 4H9q-4 0-4-4z" fill="#d7a86e"/>` +
    // tower crane
    `<rect x="30" y="40" width="16" height="112" fill="${YEL}"/>` +
    `<path d="M30 60l16 18M46 60L30 78M30 96l16 18M46 96l-16 18M30 132l16 18" stroke-width="3"/>` +
    `<rect x="16" y="32" width="120" height="12" rx="3" fill="${YEL}"/>` +
    `<rect x="12" y="44" width="18" height="12" fill="#78909c"/>` +
    `<path d="M120 44v40" stroke-width="3"/><path d="M120 84v8q0 6-6 6" stroke-width="4"/>` +
    // building
    `<rect x="80" y="90" width="66" height="62" fill="#ff8a65"/>` +
    `<path d="M80 110h66M80 130h66" stroke-width="4"/>` +
    `<rect x="88" y="94" width="14" height="12" rx="2" fill="${GLASS}" stroke-width="4"/><rect x="122" y="94" width="14" height="12" rx="2" fill="${GLASS}" stroke-width="4"/>` +
    `<rect x="88" y="114" width="14" height="12" rx="2" fill="${GLASS}" stroke-width="4"/><rect x="122" y="114" width="14" height="12" rx="2" fill="${GLASS}" stroke-width="4"/>` +
    // dirt pile
    `<path d="M120 176q14-34 36-34q22 0 34 34z" fill="#8d5a2b"/>` +
    // cone
    `<path d="M62 178l10-36q2-4 6 0l10 36z" fill="#ff7a1a"/><path d="M66 166h18" stroke="${W}" stroke-width="5"/>` +
    `<rect x="56" y="176" width="38" height="8" rx="3" fill="#ff7a1a"/>` +
    // barrier
    `<path d="M14 178v-20M50 178v-20" stroke-width="5"/><rect x="8" y="154" width="48" height="12" rx="3" fill="${W}"/><path d="M18 154l-8 12M32 154l-8 12M46 154l-8 12" stroke="#ff5252" stroke-width="5"/>`,
);

const dinoland = svg(
  frame("#ffe0b2") +
    // volcano
    `<path d="M70 150l34-80h28l34 80z" fill="#8d6e63"/>` +
    `<path d="M104 70q12 12 28 0l-6 16q-8 6-16 0z" fill="#ff5722" stroke-width="5"/>` +
    `<circle cx="112" cy="40" r="10" fill="#bdbdbd" stroke-width="4"/><circle cx="130" cy="28" r="13" fill="#bdbdbd" stroke-width="4"/>` +
    // ground
    `<path d="M5 146q50-14 100 0t90-4v50q0 4-4 4H9q-4 0-4-4z" fill="${GRASS}"/>` +
    // palm tree
    `<path d="M40 176q4-40-4-80" stroke-width="12"/><path d="M40 176q4-40-4-80" stroke="#a1887f" stroke-width="5"/>` +
    `<path d="M36 96q-24-14-30 4q16-8 30-4zM36 96q-10-26 10-30q-6 14-10 30zM36 96q20-20 40-8q-20 0-40 8zM36 96q24 0 26 20q-12-14-26-20z" fill="#43a047"/>` +
    // nest with eggs
    `<ellipse cx="150" cy="172" rx="16" ry="20" fill="#fff8e1"/>` +
    `<ellipse cx="170" cy="174" rx="13" ry="17" fill="#c5e1a5"/>` +
    `<path d="M126 176q34 22 66 0q-2 14-32 16q-30-2-34-16z" fill="#a1887f"/>` +
    // little footprints / plants
    `<path d="M90 184q4-14 0-22M90 184q8-10 14-8M90 184q-8-10-14-8" stroke="#2e7d32" stroke-width="5"/>`,
);

// ---------------------------------------------------------------------------

export interface ArtPage {
  id: string;
  name: string;
  /** Picker tab. */
  cat: "trucks" | "diggers" | "dinos" | "animals" | "scenes";
  svg: string;
}

export const MORE_PAGES: ArtPage[] = [
  { id: "firetruck", name: "fire truck", cat: "trucks", svg: firetruck },
  { id: "police", name: "police car", cat: "trucks", svg: police },
  { id: "bus", name: "school bus", cat: "trucks", svg: bus },
  { id: "train", name: "train", cat: "trucks", svg: train },
  { id: "airplane", name: "airplane", cat: "trucks", svg: airplane },
  { id: "helicopter", name: "helicopter", cat: "trucks", svg: helicopter },
  { id: "rocket", name: "rocket", cat: "trucks", svg: rocket },
  { id: "tractor", name: "tractor", cat: "diggers", svg: tractor },
  { id: "crane", name: "crane", cat: "diggers", svg: crane },
  { id: "trex", name: "T-rex", cat: "dinos", svg: trex },
  { id: "bronto", name: "brontosaurus", cat: "dinos", svg: bronto },
  { id: "cow", name: "cow", cat: "animals", svg: cow },
  { id: "pig", name: "pig", cat: "animals", svg: pig },
  { id: "lion", name: "lion", cat: "animals", svg: lion },
  { id: "elephant", name: "elephant", cat: "animals", svg: elephant },
  { id: "whale", name: "whale", cat: "animals", svg: whale },
  { id: "farm", name: "farm", cat: "scenes", svg: farm },
  { id: "site", name: "building site", cat: "scenes", svg: site },
  { id: "dinoland", name: "dinosaur land", cat: "scenes", svg: dinoland },
];
