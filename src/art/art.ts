// Original cartoon illustrations for Kidtropy.
// Every drawing is a self-contained inline SVG string (viewBox 0 0 200 200,
// transparent background). Vehicles face RIGHT and sit on the bottom third.

const O = '#2b2b3a'; // outline
const TIRE = '#3b3b4f';
const HUB = '#d5d8e0';
const GLASS = '#9fe3ff';
const YEL = '#ffc61a';
const YEL_D = '#f29f05';
const W = '#ffffff';

const n = (x: number): number => Math.round(x * 10) / 10;

const svg = (inner: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none" stroke="${O}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">${inner}</svg>`;

/** Tyre with a light hub. */
const wheel = (cx: number, cy: number, r: number): string =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${TIRE}"/>` +
  `<circle cx="${cx}" cy="${cy}" r="${n(r * 0.45)}" fill="${HUB}" stroke-width="4"/>`;

/** Small white highlight blob (no outline). */
const shine = (x: number, y: number, rx: number, ry: number): string =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${W}" stroke="none" opacity=".75"/>`;

/** Big cute eye looking right. */
const eye = (cx: number, cy: number, r: number): string =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${W}" stroke-width="4"/>` +
  `<circle cx="${n(cx + r * 0.22)}" cy="${n(cy + r * 0.05)}" r="${n(r * 0.58)}" fill="${O}" stroke="none"/>` +
  `<circle cx="${n(cx + r * 0.38)}" cy="${n(cy - r * 0.22)}" r="${n(r * 0.22)}" fill="${W}" stroke="none"/>`;

/** Crawler track with road wheels. */
const track = (x: number, y: number, w: number, h: number): string => {
  const r = h / 2;
  const cy = y + r;
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${TIRE}"/>`;
  s += `<circle cx="${x + r}" cy="${cy}" r="${n(r * 0.55)}" fill="${HUB}" stroke-width="4"/>`;
  s += `<circle cx="${x + w - r}" cy="${cy}" r="${n(r * 0.55)}" fill="${HUB}" stroke-width="4"/>`;
  const inner = 2;
  for (let i = 1; i <= inner; i++) {
    const cx = n(x + r + ((w - 2 * r) * i) / (inner + 1));
    s += `<circle cx="${cx}" cy="${cy}" r="${n(r * 0.38)}" fill="${HUB}" stroke-width="4"/>`;
  }
  return s;
};

/** A thick bar with a dark outline, drawn as two stacked strokes. */
const bar = (d: string, color: string, w: number): string =>
  `<path d="${d}" stroke-width="${w + 12}"/><path d="${d}" stroke="${color}" stroke-width="${w}"/>`;

// ---------------------------------------------------------------------------
// Construction vehicles

const excavator = svg(
  track(14, 146, 124, 38) +
    // upper house + counterweight
    `<rect x="18" y="108" width="110" height="40" rx="8" fill="${YEL}"/>` +
    `<path d="M18 116q0-8 8-8h16v40H26q-8 0-8-8z" fill="${YEL_D}"/>` +
    // cab
    `<path d="M46 108V66q0-6 6-6h28q6 0 9 6l12 42z" fill="${YEL}"/>` +
    `<path d="M56 70h22l8 30H56z" fill="${GLASS}" stroke-width="4"/>` +
    shine(64, 80, 3, 6) +
    // hydraulic cylinder
    bar('M104 104L136 66', HUB, 5) +
    // boom + arm
    bar('M112 124L148 48L170 104', YEL, 18) +
    `<circle cx="112" cy="124" r="5" fill="${HUB}" stroke-width="4"/>` +
    `<circle cx="148" cy="48" r="5" fill="${HUB}" stroke-width="4"/>` +
    // bucket
    `<path d="M146 146l4 10 6-10zM158 146l4 10 6-10zM170 146l4 10 6-10z" fill="${W}" stroke-width="4"/>` +
    `<path d="M158 98h30v28q0 22-24 22h-24q14-10 16-24z" fill="${YEL_D}"/>` +
    `<path d="M178 108l-2 20" stroke="${W}" stroke-width="4" opacity=".6"/>` +
    `<circle cx="170" cy="106" r="5" fill="${HUB}" stroke-width="4"/>`,
);

const bulldozer = svg(
  // push arms (behind)
  bar('M100 150L150 156', '#8a8fa0', 8) +
    track(14, 146, 120, 38) +
    // body
    `<rect x="18" y="104" width="108" height="44" rx="8" fill="${YEL}"/>` +
    `<rect x="96" y="114" width="26" height="8" rx="3" fill="${O}" stroke="none"/>` +
    `<rect x="96" y="128" width="26" height="8" rx="3" fill="${O}" stroke="none"/>` +
    // exhaust
    `<path d="M104 104V78" stroke-width="14"/><path d="M104 104V78" stroke="#8a8fa0" stroke-width="6"/>` +
    // cab
    `<path d="M28 104V60q0-6 6-6h40q6 0 6 6v44z" fill="${YEL}"/>` +
    `<rect x="38" y="64" width="32" height="30" rx="4" fill="${GLASS}" stroke-width="4"/>` +
    shine(46, 74, 3, 6) +
    // big blade
    `<path d="M150 88q26 4 36 16l2 76q-20 8-40 4q10-48 2-96z" fill="${YEL_D}"/>` +
    `<path d="M158 100q14 4 20 10" stroke="${W}" stroke-width="4" opacity=".6"/>`,
);

const dumptruck = svg(
  // chassis
  `<rect x="14" y="138" width="170" height="18" rx="6" fill="#55576b"/>` +
    // tipped bed with dirt
    `<g transform="rotate(-18 22 140)">` +
    `<path d="M30 92q16-30 44-28q22-16 46 0q22 0 24 26z" fill="#8d5a2b"/>` +
    `<circle cx="56" cy="78" r="5" fill="#a86d36" stroke="none"/><circle cx="96" cy="70" r="6" fill="#a86d36" stroke="none"/>` +
    `<path d="M22 92h124l-8 46H30z" fill="#ff9d1a"/>` +
    `<path d="M40 104h88M42 120h84" stroke="#d67400" stroke-width="5"/>` +
    `</g>` +
    // falling dirt
    `<circle cx="14" cy="120" r="5" fill="#8d5a2b" stroke-width="4"/><circle cx="10" cy="136" r="4" fill="#8d5a2b" stroke-width="4"/>` +
    // cab
    `<path d="M136 156V92q0-8 8-8h22q8 0 12 10l8 30v32z" fill="${YEL}"/>` +
    `<path d="M146 94h18l8 28h-26z" fill="${GLASS}" stroke-width="4"/>` +
    shine(152, 104, 3, 6) +
    `<rect x="178" y="134" width="8" height="10" rx="2" fill="#fff59d" stroke-width="4"/>` +
    wheel(44, 162, 20) +
    wheel(92, 162, 20) +
    wheel(158, 162, 20),
);

const mixer = svg(
  `<defs><clipPath id="mixer-drum"><ellipse cx="82" cy="102" rx="60" ry="38" transform="rotate(-10 82 102)"/></clipPath></defs>` +
    `<rect x="14" y="138" width="170" height="18" rx="6" fill="#55576b"/>` +
    // drum supports
    `<path d="M40 138l10-24M120 138l-8-24" stroke-width="8"/>` +
    // drum
    `<ellipse cx="82" cy="102" rx="60" ry="38" transform="rotate(-10 82 102)" fill="#eceff4"/>` +
    `<g clip-path="url(#mixer-drum)" stroke="none" fill="#ff7043">` +
    `<path d="M20 40h22l-30 140H-10z"/><path d="M64 40h22l-30 140H34z"/><path d="M108 40h22l-30 140H78z"/><path d="M152 40h22l-30 140h-22z"/>` +
    `</g>` +
    `<ellipse cx="82" cy="102" rx="60" ry="38" transform="rotate(-10 82 102)"/>` +
    shine(70, 78, 18, 5) +
    // chute
    `<path d="M24 112l-12 22" stroke-width="12"/><path d="M24 112l-12 22" stroke="#8a8fa0" stroke-width="5"/>` +
    // cab
    `<path d="M140 156V92q0-8 8-8h20q8 0 11 10l7 30v32z" fill="#1e88e5"/>` +
    `<path d="M150 94h16l7 28h-23z" fill="${GLASS}" stroke-width="4"/>` +
    shine(156, 104, 3, 6) +
    wheel(46, 162, 20) +
    wheel(94, 162, 20) +
    wheel(160, 162, 20),
);

const roller = svg(
  // canopy poles + roof
  `<path d="M44 106V52M100 106V52" stroke-width="6"/>` +
    `<rect x="32" y="40" width="82" height="14" rx="6" fill="${YEL_D}"/>` +
    // seat + steering
    `<path d="M54 106V84h16" stroke-width="8"/><path d="M88 106l6-20" stroke-width="5"/><path d="M86 84h16" stroke-width="6"/>` +
    // body
    `<path d="M20 150v-36q0-8 8-8h86q8 0 12 8l8 36z" fill="${YEL}"/>` +
    // front drum frame
    `<path d="M116 150q0-54 34-54q28 0 28 54" stroke-width="20"/><path d="M116 150q0-54 34-54q28 0 28 54" stroke="${YEL}" stroke-width="9"/>` +
    // drum
    `<circle cx="148" cy="152" r="32" fill="#9aa0ae"/>` +
    `<circle cx="148" cy="152" r="14" fill="${HUB}" stroke-width="4"/>` +
    shine(134, 136, 6, 4) +
    // rear wheel
    wheel(56, 160, 24) +
    // flat road line
    `<path d="M12 186h176" stroke-width="5" opacity=".35"/>`,
);

const garbage = svg(
  `<rect x="14" y="138" width="170" height="18" rx="6" fill="#55576b"/>` +
    // body box
    `<path d="M12 146V84q0-16 18-16h96v78z" fill="#43a047"/>` +
    `<path d="M24 92h90M24 110h90M24 128h90" stroke="#2e7d32" stroke-width="5"/>` +
    `<rect x="30" y="98" width="28" height="22" rx="4" fill="${W}" stroke-width="4"/>` +
    `<path d="M38 104l6 10 6-10" stroke="#43a047" stroke-width="4"/>` +
    shine(40, 76, 14, 3) +
    // cab
    `<path d="M132 156V92q0-8 8-8h24q8 0 12 10l8 30v32z" fill="${W}"/>` +
    `<path d="M142 94h20l8 28h-28z" fill="${GLASS}" stroke-width="4"/>` +
    `<rect x="132" y="128" width="52" height="10" fill="#43a047" stroke-width="4"/>` +
    // lifter arm
    `<path d="M128 132l-6 22" stroke-width="7"/>` +
    wheel(46, 162, 20) +
    wheel(94, 162, 20) +
    wheel(160, 162, 20),
);

const tow = svg(
  // boom + cable + hook
  bar('M86 132L44 62', '#8a8fa0', 8) +
    `<path d="M42 62V112" stroke-width="4"/>` +
    `<path d="M42 112v16q0 12-13 12q-13 0-13-12l6 4" stroke-width="13"/>` +
    `<path d="M42 112v16q0 12-13 12q-13 0-13-12l6 4" stroke="#b8bccb" stroke-width="5"/>` +
    // rear deck
    `<path d="M14 156v-22q0-6 6-6h88v28z" fill="#e53935"/>` +
    // cab + hood
    `<path d="M100 156V84q0-8 8-8h32q8 0 12 10l8 28h18q10 0 10 10v32z" fill="#e53935"/>` +
    `<path d="M112 86h26l9 28h-35z" fill="${GLASS}" stroke-width="4"/>` +
    shine(120, 98, 3, 6) +
    // light bar
    `<rect x="112" y="64" width="30" height="12" rx="5" fill="#ffd54f"/>` +
    `<rect x="182" y="128" width="8" height="10" rx="2" fill="#fff59d" stroke-width="4"/>` +
    `<path d="M24 142h70" stroke="${W}" stroke-width="5" opacity=".7"/>` +
    wheel(50, 162, 21) +
    wheel(154, 162, 21),
);

const bigTire = (cx: number, cy: number, r: number): string =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${TIRE}"/>` +
  `<circle cx="${cx}" cy="${cy}" r="${r - 4}" stroke="#6b6d85" stroke-width="7" stroke-dasharray="8 9" stroke-linecap="butt"/>` +
  `<circle cx="${cx}" cy="${cy}" r="${n(r * 0.42)}" fill="#ffd54f" stroke-width="4"/>` +
  `<circle cx="${cx}" cy="${cy}" r="5" fill="${O}" stroke="none"/>`;

const monster = svg(
  // suspension
  `<path d="M50 140l10-36M150 140l-10-36" stroke-width="8"/>` +
    `<path d="M50 140l10-36M150 140l-10-36" stroke="#e0e0e0" stroke-width="3" stroke-dasharray="3 4"/>` +
    // body
    `<path d="M22 108V88q0-6 6-6h44l14-26q4-6 12-6h30q8 0 12 8l12 24h24q8 0 8 8v18q0 6-6 6H28q-6 0-6-6z" fill="#8e24aa"/>` +
    `<path d="M96 80l10-20h22l10 20z" fill="${GLASS}" stroke-width="4"/>` +
    `<path d="M30 98h150" stroke="#ffd54f" stroke-width="6"/>` +
    shine(110, 66, 3, 5) +
    bigTire(52, 148, 38) +
    bigTire(148, 148, 38),
);

const cone = svg(
  `<path d="M100 20q-6 0-8 8L56 164h88L108 28q-2-8-8-8z" fill="#ff7a1a"/>` +
    `<path d="M87 58h26l6 24H81zM72 112h56l6 24H66z" fill="${W}" stroke="none"/>` +
    `<path d="M100 20q-6 0-8 8L56 164h88L108 28q-2-8-8-8z"/>` +
    `<rect x="30" y="160" width="140" height="20" rx="6" fill="#ff7a1a"/>` +
    `<path d="M88 40q-4 16-8 30" stroke="${W}" stroke-width="4" opacity=".7"/>`,
);

// ---------------------------------------------------------------------------
// Dinosaurs

/** Circle with a scalloped (bumpy) edge. */
const scallop = (cx: number, cy: number, r: number, k: number, fill: string): string => {
  let d = '';
  for (let i = 0; i <= k; i++) {
    const a = (i / k) * Math.PI * 2;
    const x = n(cx + r * Math.cos(a));
    const y = n(cy + r * Math.sin(a));
    d += i === 0 ? `M${x} ${y}` : `A${n(r * 0.3)} ${n(r * 0.3)} 0 0 1 ${x} ${y}`;
  }
  return `<path d="${d}z" fill="${fill}"/>`;
};

const triceratops = svg(
  // tail
  `<path d="M34 114Q14 122 8 150q22-4 40-18z" fill="#26a69a"/>` +
    // back legs
    `<rect x="32" y="138" width="22" height="40" rx="9" fill="#1e8a7f"/>` +
    `<rect x="88" y="138" width="22" height="40" rx="9" fill="#1e8a7f"/>` +
    // body
    `<ellipse cx="74" cy="122" rx="54" ry="38" fill="#26a69a"/>` +
    `<path d="M46 104q10-6 22-4M78 98q10-2 20 4" stroke="#1e8a7f" stroke-width="5"/>` +
    // front legs
    `<rect x="48" y="146" width="22" height="36" rx="9" fill="#26a69a"/>` +
    `<rect x="102" y="146" width="22" height="36" rx="9" fill="#26a69a"/>` +
    // frill
    scallop(126, 98, 36, 11, '#ffb74d') +
    `<circle cx="126" cy="98" r="22" fill="#ffcc80" stroke="none"/>` +
    `<circle cx="104" cy="88" r="4" fill="#ff7043" stroke="none"/><circle cx="118" cy="72" r="4" fill="#ff7043" stroke="none"/><circle cx="102" cy="110" r="4" fill="#ff7043" stroke="none"/>` +
    // brow horns
    `<path d="M136 92l14-46 6 44z" fill="#e8dcc0"/>` +
    `<path d="M152 92l26-40-6 46z" fill="#fff3d6"/>` +
    // head
    `<path d="M126 108q4-20 30-20q28 0 32 26q2 22-22 24h-22q-20-2-18-30z" fill="#26a69a"/>` +
    `<path d="M178 98l6-18 4 20z" fill="#fff3d6" stroke-width="4"/>` +
    eye(154, 110, 11) +
    `<path d="M162 128q10 6 20-2" stroke-width="4"/>` +
    `<circle cx="142" cy="126" r="5" fill="#ff8a80" stroke="none" opacity=".7"/>` +
    shine(58, 104, 12, 4),
);

const plate = (x: number, y: number, a: number, s: number, c: string): string =>
  `<path transform="translate(${x} ${y}) rotate(${a}) scale(${s})" d="M-12 6Q-10-16 0-26Q10-16 12 6z" fill="${c}" stroke-width="${n(6 / s)}"/>`;

const stegosaurus = svg(
  // tail with spikes
  `<path d="M18 112l-10-24 22 14zM38 108l2-26 16 22z" fill="#fff3d6" stroke-width="5"/>` +
    `<path d="M60 132Q30 140 10 120q0-12 12-12q18 10 38-8z" fill="#9c6ade"/>` +
    // plates
    plate(48, 96, -55, 0.8, '#ffb74d') +
    plate(66, 84, -30, 1, '#ff8a3d') +
    plate(88, 78, -8, 1.15, '#ffb74d') +
    plate(112, 80, 15, 1.05, '#ff8a3d') +
    plate(132, 92, 40, 0.85, '#ffb74d') +
    // back legs
    `<rect x="44" y="138" width="22" height="42" rx="9" fill="#7e4cc0"/>` +
    `<rect x="104" y="138" width="20" height="40" rx="9" fill="#7e4cc0"/>` +
    // body
    `<path d="M36 132q0-46 56-46q50 0 58 38q2 18-24 22H60q-24 0-24-14z" fill="#9c6ade"/>` +
    // neck + head
    `<path d="M136 114q16-4 28 4q24 0 26 18q0 14-18 14q-18 0-30-10z" fill="#9c6ade"/>` +
    eye(168, 128, 9) +
    `<path d="M172 142q8 2 12-4" stroke-width="4"/>` +
    // front legs
    `<rect x="60" y="144" width="22" height="38" rx="9" fill="#9c6ade"/>` +
    `<rect x="116" y="144" width="20" height="36" rx="9" fill="#9c6ade"/>` +
    `<circle cx="80" cy="118" r="5" fill="#7e4cc0" stroke="none"/><circle cx="100" cy="108" r="4" fill="#7e4cc0" stroke="none"/><circle cx="112" cy="124" r="5" fill="#7e4cc0" stroke="none"/>` +
    shine(84, 98, 14, 4),
);

const pterodactyl = svg(
  // wings
  `<path d="M92 100L14 56q-4 30 14 52q8-8 18 0q8-8 18 2q10-6 20 4z" fill="#ffab91"/>` +
    `<path d="M108 100L186 56q4 30-14 52q-8-8-18 0q-8-8-18 2q-10-6-20 4z" fill="#ffab91"/>` +
    `<path d="M92 100L14 56M108 100L186 56" stroke="#ff7043" stroke-width="7"/>` +
    // feet
    `<path d="M92 150l-6 16M108 150l6 16" stroke-width="6"/>` +
    // body
    `<ellipse cx="100" cy="122" rx="20" ry="32" fill="#ff7043"/>` +
    `<ellipse cx="100" cy="130" rx="11" ry="18" fill="#ffccbc" stroke="none"/>` +
    // crest + beak + head
    `<path d="M88 60L58 30l40 14z" fill="#ff7043"/>` +
    `<path d="M112 62l50 12q2 6-4 8l-46 4z" fill="#ffd54f"/>` +
    `<circle cx="100" cy="66" r="22" fill="#ff7043"/>` +
    eye(104, 62, 10) +
    `<path d="M114 80q10 4 20 2" stroke-width="4"/>` +
    shine(90, 52, 5, 3),
);

const BONE = '#f1e0c5';
const fossil = svg(
  // bone behind (outline pass, then fill pass)
  `<g transform="rotate(-8 100 166)">` +
    `<circle cx="42" cy="158" r="10"/><circle cx="42" cy="174" r="10"/><circle cx="158" cy="158" r="10"/><circle cx="158" cy="174" r="10"/>` +
    `<path d="M42 166h116" stroke-width="24"/>` +
    `<g fill="${BONE}" stroke="none"><circle cx="42" cy="158" r="10"/><circle cx="42" cy="174" r="10"/><circle cx="158" cy="158" r="10"/><circle cx="158" cy="174" r="10"/></g>` +
    `<path d="M42 166h116" stroke="${BONE}" stroke-width="12"/>` +
    `</g>` +
    // lower jaw
    `<path d="M36 104l146 6q10 4 4 14q-10 12-36 12H80q-34 0-44-32z" fill="#e8d3b0"/>` +
    // teeth
    `<path d="M70 108l5 13 6-12 5 13 6-12 5 13 6-12 5 13 6-12 5 13 6-12 5 13 6-12 5 13 6-12 5 12 6-11" fill="${W}" stroke-width="4"/>` +
    // skull
    `<path d="M20 92q-2-34 26-44q30-12 60-6q44 8 70 26q16 12 12 30q-2 10-14 12l-134 0q-18-2-20-18z" fill="${BONE}"/>` +
    // holes: temporal, eye socket, big snout hole, nostril
    `<ellipse cx="40" cy="78" rx="9" ry="12" fill="${O}" stroke="none"/>` +
    `<circle cx="72" cy="74" r="14" fill="${O}" stroke="none"/>` +
    `<path d="M100 82q6-16 24-14q16 2 18 14q-2 10-18 10q-22 0-24-10z" fill="${O}" stroke="none"/>` +
    `<ellipse cx="170" cy="86" rx="6" ry="4" fill="${O}" stroke="none"/>` +
    `<path d="M96 52q24 2 44 12" stroke="#c9b38f" stroke-width="5"/>` +
    `<circle cx="76" cy="70" r="3" fill="#57576b" stroke="none"/>` +
    shine(46, 58, 10, 3),
);

/** Full inline SVG strings, keyed by item id. */
export const ART: Record<string, string> = {
  excavator,
  bulldozer,
  dumptruck,
  mixer,
  roller,
  garbage,
  tow,
  monster,
  cone,
  triceratops,
  stegosaurus,
  pterodactyl,
  fossil,
};

// ---------------------------------------------------------------------------
// Colorable vehicles (no ids, so they can be inlined many times on one page)

const SHADE = 'rgba(0,0,0,.18)';

/** A side-view cartoon car whose body is painted `body` (any CSS color). */
export function colorCar(body: string): string {
  return svg(
    `<path d="M14 150v-26q0-14 16-16l24-2 22-30q6-8 16-8h30q10 0 18 8l26 30 14 2q16 4 16 20v22z" fill="${body}"/>` +
      `<path d="M64 106l18-24q4-4 10-4h12v28z" fill="${GLASS}" stroke-width="4"/>` +
      `<path d="M114 78h8q6 0 10 4l20 24h-38z" fill="${GLASS}" stroke-width="4"/>` +
      `<path d="M18 138h168" stroke="${SHADE}" stroke-width="10" stroke-linecap="butt"/>` +
      `<path d="M14 150v-26q0-14 16-16l24-2 22-30q6-8 16-8h30q10 0 18 8l26 30 14 2q16 4 16 20v22z"/>` +
      `<path d="M108 112v26M100 120h-12" stroke-width="4"/>` +
      `<rect x="176" y="118" width="12" height="10" rx="4" fill="#fff59d" stroke-width="4"/>` +
      `<rect x="12" y="118" width="10" height="10" rx="3" fill="#ff5252" stroke-width="4"/>` +
      shine(76, 90, 3, 6) +
      `<path d="M40 116h30" stroke="${W}" stroke-width="5" opacity=".6"/>` +
      wheel(54, 152, 22) +
      wheel(150, 152, 22),
  );
}

/** A side-view cartoon pickup truck whose body/cab is painted `body`. */
export function colorTruck(body: string): string {
  const shape = 'M12 154v-46h86V70q0-8 8-8h30q10 0 14 10l12 32h20q14 2 14 18v32z';
  return svg(
    `<path d="${shape}" fill="${body}"/>` +
      `<path d="M110 72h24l12 32h-36z" fill="${GLASS}" stroke-width="4"/>` +
      `<path d="M16 140h170" stroke="${SHADE}" stroke-width="10" stroke-linecap="butt"/>` +
      `<path d="${shape}"/>` +
      `<path d="M98 108v40M12 120h86" stroke-width="5"/>` +
      `<path d="M118 116h10" stroke-width="4"/>` +
      `<rect x="178" y="120" width="10" height="10" rx="3" fill="#fff59d" stroke-width="4"/>` +
      shine(118, 84, 3, 6) +
      `<path d="M24 112h40" stroke="${W}" stroke-width="5" opacity=".6"/>` +
      wheel(50, 156, 22) +
      wheel(152, 156, 22),
  );
}

/** A side-view race car with a number 1, painted `body`, facing right. */
export function raceCar(body: string): string {
  const shape = 'M12 150v-22q0-8 8-8h42l14-16h32l12 16h44q28 4 30 24v6z';
  return svg(
    // rear wing
    `<path d="M26 120V88" stroke-width="7"/>` +
      `<rect x="8" y="76" width="40" height="12" rx="4" fill="${body}"/>` +
      `<path d="${shape}" fill="${body}"/>` +
      `<path d="M16 142h172" stroke="${SHADE}" stroke-width="10" stroke-linecap="butt"/>` +
      `<path d="${shape}"/>` +
      // driver helmet + visor
      `<circle cx="90" cy="100" r="14" fill="${W}"/>` +
      `<path d="M92 94h13v8H92z" fill="${O}" stroke-width="3"/>` +
      // number roundel
      `<circle cx="110" cy="132" r="14" fill="${W}" stroke-width="4"/>` +
      `<text x="110" y="140" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="bold" font-size="22" fill="${O}" stroke="none">1</text>` +
      `<path d="M136 128h34" stroke="${W}" stroke-width="5" opacity=".6"/>` +
      `<rect x="180" y="136" width="10" height="7" rx="3" fill="#fff59d" stroke-width="4"/>` +
      wheel(46, 152, 24) +
      wheel(162, 154, 22),
  );
}
