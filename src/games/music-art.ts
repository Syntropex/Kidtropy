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
