/**
 * Little drawings for the Music game (same style as src/art/art.ts:
 * viewBox 0 0 200 200, dark rounded outlines).
 */
const O = "#2b2b3a";

const svg = (inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none" stroke="${O}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">${inner}</svg>`;

export const BAR_COLORS = ["#ef5350", "#ff9800", "#ffd600", "#66bb6a", "#26c6da", "#42a5f5", "#7e57c2", "#ec407a"];

const xyloBars = BAR_COLORS.map((c, i) => {
  const w = 17;
  const x = 22 + i * 20;
  const hgt = 118 - i * 9;
  const y = 100 - hgt / 2 + 6;
  return `<rect x="${x}" y="${y}" width="${w}" height="${hgt}" rx="6" fill="${c}" stroke-width="4"/>`;
}).join("");

export const MUSIC_ART = {
  xylophone: svg(
    `<path d="M14 72 L186 96 M14 140 L186 124" stroke-width="10" stroke="#8d6e63"/>${xyloBars}` +
      `<path d="M150 36 L118 74" stroke-width="7"/><circle cx="156" cy="30" r="14" fill="#ff5252"/>`,
  ),
  drum: svg(
    `<path d="M40 88 v54 c0 16 120 16 120 0 v-54" fill="#e53935"/>` +
      `<path d="M40 100 l24 46 l24 -42 l24 42 l24 -42 l24 42" stroke="#fff" stroke-width="5"/>` +
      `<path d="M40 88 v54 c0 16 120 16 120 0 v-54" />` +
      `<ellipse cx="100" cy="88" rx="60" ry="18" fill="#fafafa"/>` +
      `<path d="M62 20 L104 80 M150 22 L104 80" stroke-width="7"/><circle cx="60" cy="18" r="9" fill="#ffd54f"/><circle cx="152" cy="20" r="9" fill="#ffd54f"/>`,
  ),
  kick: svg(
    `<circle cx="100" cy="98" r="76" fill="#1e88e5"/><circle cx="100" cy="98" r="56" fill="#fffde7"/>` +
      `<path d="M100 62 l10 22 l24 2 l-18 16 l6 24 l-22 -13 l-22 13 l6 -24 l-18 -16 l24 -2 z" fill="#ffca28" stroke-width="5"/>` +
      `<path d="M40 178 l-10 16 M160 178 l10 16" stroke-width="7"/>`,
  ),
  hat: svg(
    `<path d="M100 70 V190 M70 190 h60" stroke-width="7"/>` +
      `<path d="M30 92 Q100 60 170 92 Q100 104 30 92 z" fill="#ffd54f"/>` +
      `<path d="M30 76 Q100 44 170 76 Q100 88 30 76 z" fill="#ffca28"/>` +
      `<circle cx="100" cy="58" r="8" fill="${O}"/>`,
  ),
  tom: svg(
    `<path d="M36 70 v64 c0 18 128 18 128 0 v-64" fill="#43a047"/>` +
      `<path d="M36 70 v64 c0 18 128 18 128 0 v-64"/>` +
      `<path d="M58 86 v58 M100 90 v60 M142 86 v58" stroke-width="5" stroke="#c8e6c9"/>` +
      `<ellipse cx="100" cy="70" rx="64" ry="20" fill="#fafafa"/>` +
      `<circle cx="100" cy="70" r="10" fill="#bdbdbd" stroke-width="4"/>`,
  ),
  clap: svg(
    `<g transform="rotate(-18 80 110)"><rect x="44" y="60" width="50" height="104" rx="25" fill="#ffcc80"/><path d="M54 78 v24 M68 72 v30 M82 78 v24" stroke-width="4"/></g>` +
      `<g transform="rotate(18 120 110)"><rect x="106" y="60" width="50" height="104" rx="25" fill="#ffb74d"/><path d="M118 78 v24 M132 72 v30 M146 78 v24" stroke-width="4"/></g>` +
      `<path d="M100 18 v22 M66 28 l10 18 M134 28 l-10 18" stroke="#ff7043" stroke-width="7"/>`,
  ),
  crash: svg(
    `<path d="M100 92 V190 M70 190 h60" stroke-width="7"/>` +
      `<path d="M22 100 Q100 40 178 72 Q110 108 22 100 z" fill="#ffd54f"/>` +
      `<path d="M60 88 Q100 64 140 76" stroke="#fff59d" stroke-width="5"/>` +
      `<circle cx="100" cy="76" r="8" fill="${O}"/>` +
      `<path d="M30 34 l8 16 l16 8 l-16 8 l-8 16 l-8 -16 l-16 -8 l16 -8 z" fill="#fff" stroke-width="4"/>` +
      `<path d="M166 108 l5 10 l10 5 l-10 5 l-5 10 l-5 -10 l-10 -5 l10 -5 z" fill="#fff" stroke-width="4"/>`,
  ),
  songs: svg(
    `<path d="M80 150 V40 L164 22 V128" fill="none" stroke-width="12"/><path d="M80 40 L164 22 V50 L80 68 z" fill="${O}"/>` +
      `<ellipse cx="58" cy="152" rx="26" ry="20" transform="rotate(-20 58 152)" fill="#ffd600"/>` +
      `<ellipse cx="142" cy="132" rx="26" ry="20" transform="rotate(-20 142 132)" fill="#ff5252"/>` +
      `<path d="M30 40 l7 14 l14 7 l-14 7 l-7 14 l-7 -14 l-14 -7 l14 -7 z" fill="#fff" stroke-width="4"/>`,
  ),
  piano: svg(
    `<rect x="16" y="50" width="168" height="108" rx="14" fill="#fff"/>` +
      `<path d="M44 50 V158 M72 50 V158 M100 50 V158 M128 50 V158 M156 50 V158" stroke-width="5"/>` +
      `<rect x="34" y="50" width="20" height="62" rx="4" fill="${O}"/><rect x="62" y="50" width="20" height="62" rx="4" fill="${O}"/>` +
      `<rect x="118" y="50" width="20" height="62" rx="4" fill="${O}"/><rect x="146" y="50" width="20" height="62" rx="4" fill="${O}"/>` +
      `<rect x="16" y="34" width="168" height="22" rx="8" fill="#e53935"/>`,
  ),
  musicbox: svg(
    `<path d="M30 92 h140 v70 c0 8 -6 14 -14 14 h-112 c-8 0 -14 -6 -14 -14 z" fill="#ec407a"/>` +
      `<path d="M24 74 l12 -30 h128 l12 30 z" fill="#f48fb1"/><rect x="24" y="74" width="152" height="18" rx="6" fill="#f06292"/>` +
      `<path d="M80 128 h40" stroke="#ffd54f" stroke-width="10"/><circle cx="100" cy="128" r="9" fill="#ffd54f" stroke-width="4"/>` +
      `<path d="M170 120 h18 v-18" stroke-width="7"/><circle cx="188" cy="98" r="7" fill="#ffd54f" stroke-width="4"/>` +
      `<path d="M96 40 V8 L120 4" stroke-width="6"/><ellipse cx="88" cy="42" rx="10" ry="8" fill="#7e57c2"/>`,
  ),
  steeldrum: svg(
    `<path d="M24 92 v44 c0 26 152 26 152 0 v-44" fill="#90a4ae"/>` +
      `<ellipse cx="100" cy="92" rx="76" ry="34" fill="#cfd8dc"/>` +
      `<ellipse cx="72" cy="88" rx="20" ry="11" fill="#eceff1" stroke-width="4"/><ellipse cx="128" cy="88" rx="20" ry="11" fill="#eceff1" stroke-width="4"/>` +
      `<ellipse cx="100" cy="108" rx="16" ry="8" fill="#eceff1" stroke-width="4"/><ellipse cx="100" cy="72" rx="14" ry="7" fill="#eceff1" stroke-width="4"/>` +
      `<path d="M150 20 L120 70" stroke-width="7"/><circle cx="154" cy="16" r="10" fill="#ff7043"/>`,
  ),
  parrot: svg(
    `<path d="M92 150 l-20 40 l26 -14 l8 18 l10 -40" fill="#1e88e5"/>` +
      `<ellipse cx="104" cy="112" rx="50" ry="58" fill="#43a047"/>` +
      `<path d="M64 108 c-14 30 6 58 32 62 c-24 -18 -30 -40 -32 -62 z" fill="#2e7d32" stroke-width="5"/>` +
      `<circle cx="112" cy="58" r="42" fill="#e53935"/>` +
      `<circle cx="102" cy="52" r="13" fill="#fff" stroke-width="4"/><circle cx="105" cy="53" r="7" fill="${O}" stroke="none"/><circle cx="102" cy="49" r="2.5" fill="#fff" stroke="none"/>` +
      `<path class="beak-top" d="M134 46 c26 0 36 18 30 36 c-6 -10 -18 -14 -30 -10 z" fill="#ffca28"/>` +
      `<path class="beak-bottom" d="M134 74 c10 -2 20 2 24 10 c-8 6 -20 6 -28 -2 z" fill="#ffa000"/>` +
      `<path d="M84 30 c-8 -14 -2 -24 6 -26 M96 22 c-2 -14 6 -20 14 -18" stroke="#e53935" stroke-width="8"/>` +
      `<path d="M78 176 h-10 M120 176 h12" stroke="#8d6e63" stroke-width="8"/>`,
  ),
  grid: svg(
    [0, 1, 2, 3]
      .flatMap((r) =>
        [0, 1, 2, 3].map((c) => {
          const on = (r * 3 + c * 5) % 4 === 0 || (r === 0 && c % 2 === 0) || (r === 2 && c === 3);
          const col = ["#42a5f5", "#ef5350", "#ffca28", "#66bb6a"][r];
          return `<rect x="${18 + c * 42}" y="${18 + r * 42}" width="36" height="36" rx="9" fill="${on ? col : "#fff"}" stroke-width="5"/>`;
        }),
      )
      .join(""),
  ),
  disco: svg(
    `<path d="M100 4 V36" stroke-width="5"/>` +
      `<circle cx="100" cy="100" r="64" fill="#b0bec5"/>` +
      `<path d="M40 76 h120 M38 100 h124 M40 124 h120 M56 54 h88 M56 146 h88" stroke-width="4"/>` +
      `<path d="M100 36 c-30 20 -30 108 0 128 M100 36 c30 20 30 108 0 128 M100 36 V164 M66 46 c-20 30 -20 78 0 108 M134 46 c20 30 20 78 0 108" stroke-width="4"/>` +
      `<rect x="72" y="80" width="18" height="16" fill="#fff59d" stroke="none"/><rect x="112" y="104" width="18" height="16" fill="#81d4fa" stroke="none"/><rect x="88" y="128" width="16" height="14" fill="#f48fb1" stroke="none"/>` +
      `<path d="M24 160 l6 12 l12 6 l-12 6 l-6 12 l-6 -12 l-12 -6 l12 -6 z" fill="#fff" stroke-width="4"/>` +
      `<path d="M172 24 l5 10 l10 5 l-10 5 l-5 10 l-5 -10 l-10 -5 l10 -5 z" fill="#fff" stroke-width="4"/>`,
  ),
  bridge: svg(
    `<rect x="8" y="140" width="184" height="40" rx="10" fill="#4fc3f7" stroke="none"/>` +
      `<path d="M10 104 h180" stroke-width="10" stroke="#8d6e63"/>` +
      `<rect x="40" y="40" width="22" height="110" rx="4" fill="#90a4ae"/><rect x="138" y="40" width="22" height="110" rx="4" fill="#90a4ae"/>` +
      `<path d="M10 70 Q51 110 51 42 Q100 120 149 42 Q149 110 190 70" stroke="#e53935" stroke-width="6"/>` +
      `<path d="M70 104 v-20 M100 104 v-30 M130 104 v-20" stroke-width="4"/>`,
  ),
  spider: svg(
    `<path d="M100 0 V60" stroke-width="4"/>` +
      `<path d="M70 96 l-36 -22 l-14 20 M70 108 l-44 -2 l-12 18 M72 120 l-38 18 l-4 22 M78 130 l-24 30 l4 22" stroke-width="7"/>` +
      `<path d="M130 96 l36 -22 l14 20 M130 108 l44 -2 l12 18 M128 120 l38 18 l4 22 M122 130 l24 30 l-4 22" stroke-width="7"/>` +
      `<ellipse cx="100" cy="110" rx="38" ry="34" fill="#5c6bc0"/>` +
      `<circle cx="100" cy="72" r="24" fill="#7986cb"/>` +
      `<circle cx="91" cy="70" r="8" fill="#fff" stroke-width="3"/><circle cx="109" cy="70" r="8" fill="#fff" stroke-width="3"/>` +
      `<circle cx="92" cy="71" r="4" fill="${O}" stroke="none"/><circle cx="110" cy="71" r="4" fill="${O}" stroke="none"/>` +
      `<path d="M92 84 q8 7 16 0" stroke-width="4"/>`,
  ),
  clear: svg(
    `<rect x="40" y="40" width="120" height="120" rx="22" fill="#fff" stroke-width="8"/>` +
      `<path d="M120 24 l40 40 l-70 70 l-40 -40 z" fill="#f48fb1"/><path d="M90 134 l-40 -40 l-14 14 l40 40 z" fill="#90caf9"/>`,
  ),
  play: svg(`<path d="M66 40 L160 100 L66 160 z" fill="#43a047" stroke-width="8"/>`),
  pause: svg(`<rect x="52" y="40" width="34" height="120" rx="10" fill="#fb8c00" stroke-width="8"/><rect x="114" y="40" width="34" height="120" rx="10" fill="#fb8c00" stroke-width="8"/>`),
  stop: svg(`<rect x="50" y="50" width="100" height="100" rx="18" fill="#e53935" stroke-width="8"/>`),
};

/** Little floating notes, filled with a bar's color. */
export const noteArt = (color: string, beamed: boolean) =>
  beamed
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" stroke="${O}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">` +
      `<path d="M26 60 V14 L68 6 V52" fill="none" stroke-width="7"/><path d="M26 14 L68 6 V18 L26 26 z" fill="${O}"/>` +
      `<ellipse cx="17" cy="62" rx="12" ry="9" transform="rotate(-22 17 62)" fill="${color}"/>` +
      `<ellipse cx="59" cy="54" rx="12" ry="9" transform="rotate(-22 59 54)" fill="${color}"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" stroke="${O}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">` +
      `<path d="M40 62 V8 C46 20 64 22 60 42" fill="none" stroke-width="7"/>` +
      `<ellipse cx="30" cy="63" rx="13" ry="10" transform="rotate(-22 30 63)" fill="${color}"/></svg>`;

export type MusicArt = keyof typeof MUSIC_ART;
