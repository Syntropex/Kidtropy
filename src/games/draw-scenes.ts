/**
 * Pictures to draw on in free drawing: soft, simple backgrounds so the
 * child's own drawing stays the star. Each is a 400×400 SVG that is cropped
 * ("slice") to the paper's shape and painted under the ink.
 */
import { loadImage } from "./draw-shared";

export interface Scene {
  id: string;
  say: string;
  svg: string;
  /** Dark background: the ink defaults look better light. */
  dark?: boolean;
}

const S = (inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">${inner}</svg>`;

const cloud = (x: number, y: number, s: number, c = "#ffffff") =>
  `<g fill="${c}" transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="34" ry="18"/><ellipse cx="-26" cy="8" rx="22" ry="14"/><ellipse cx="28" cy="8" rx="24" ry="14"/><ellipse cx="4" cy="-12" rx="22" ry="16"/></g>`;

const star4 = (x: number, y: number, r: number) =>
  `<path d="M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}z" fill="#fffde7"/>`;

const dots = (n: number, seed: number, x0: number, y0: number, w: number, hgt: number, r: number, fill: string) => {
  let s = "";
  let a = seed;
  const rnd = () => ((a = (a * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < n; i++) s += `<circle cx="${(x0 + rnd() * w).toFixed(0)}" cy="${(y0 + rnd() * hgt).toFixed(0)}" r="${(r * (0.5 + rnd())).toFixed(1)}" fill="${fill}"/>`;
  return s;
};

export const SCENES: Scene[] = [
  { id: "paper", say: "Plain paper!", svg: S(`<rect width="400" height="400" fill="#ffffff"/>`) },
  {
    id: "road",
    say: "A road!",
    svg: S(
      `<rect width="400" height="400" fill="#dff3ff"/>` +
        `<circle cx="330" cy="80" r="36" fill="#fff3b0"/>` +
        cloud(90, 80, 1.1) +
        cloud(230, 130, 0.8) +
        `<path d="M0 240q80-40 170-10t230-10v180H0z" fill="#cdeab0"/>` +
        `<rect y="262" width="400" height="138" fill="#bfe39b"/>` +
        `<rect y="282" width="400" height="80" fill="#a7adb6"/>` +
        `<path d="M0 286h400M0 358h400" stroke="#e8eaed" stroke-width="5"/>` +
        `<path d="M0 322h400" stroke="#ffffff" stroke-width="7" stroke-dasharray="34 26"/>` +
        dots(14, 3, 0, 370, 400, 30, 4, "#a5d17e"),
    ),
  },
  {
    id: "farm",
    say: "A farm!",
    svg: S(
      `<rect width="400" height="400" fill="#e6f6ff"/>` +
        `<circle cx="70" cy="70" r="32" fill="#fff3b0"/>` +
        cloud(250, 70, 1) +
        `<path d="M0 220q100-50 200-10t200-20v210H0z" fill="#c8e6c9"/>` +
        `<path d="M0 250q120-30 240 0t160-6v156H0z" fill="#b5dc9a"/>` +
        // field rows
        `<path d="M0 300q200-24 400 0v100H0z" fill="#ecd3ac"/>` +
        `<path d="M0 318q200-22 400 0M0 340q200-20 400 0M0 362q200-18 400 0M0 384q200-16 400 0" stroke="#dcbb8c" stroke-width="6" fill="none"/>` +
        // fence
        `<path d="M20 296v-34M70 292v-34M120 289v-34M170 287v-34M220 287v-34M270 288v-34M320 290v-34M370 293v-34" stroke="#f5f5f5" stroke-width="7" stroke-linecap="round"/>` +
        `<path d="M0 270q200-14 400 0M0 284q200-14 400 0" stroke="#f5f5f5" stroke-width="5" fill="none"/>` +
        // little barn far away
        `<path d="M330 236v-30l18-12 18 12v30z" fill="#ef9a9a"/><path d="M326 208l22-16 22 16" stroke="#bcaaa4" stroke-width="5" fill="none"/>`,
    ),
  },
  {
    id: "dirt",
    say: "A building site!",
    svg: S(
      `<rect width="400" height="400" fill="#fff4dc"/>` +
        `<circle cx="320" cy="70" r="30" fill="#ffe7a3"/>` +
        cloud(100, 90, 0.9, "#ffffff") +
        `<rect y="210" width="400" height="190" fill="#e8c493"/>` +
        `<path d="M-10 236q60-56 120 0z" fill="#d7a96f"/><path d="M250 232q70-70 160 0z" fill="#d7a96f"/>` +
        `<path d="M40 300h320M30 340h340" stroke="#d9b27c" stroke-width="10" stroke-dasharray="14 10" fill="none"/>` +
        dots(26, 7, 0, 250, 400, 150, 5, "#cfa46b"),
    ),
  },
  {
    id: "jungle",
    say: "A dino jungle!",
    svg: S(
      `<rect width="400" height="400" fill="#eafbe0"/>` +
        `<path d="M150 230l50-110h40l50 110z" fill="#d7c4b5"/><path d="M200 120q20 14 40 0l-4 14q-16 8-32 0z" fill="#ffab91"/>` +
        `<circle cx="226" cy="90" r="14" fill="#e0e0e0"/><circle cx="250" cy="70" r="18" fill="#e0e0e0"/>` +
        `<path d="M0 240q100-30 200 0t200-6v166H0z" fill="#c5e6a6"/>` +
        `<path d="M0 300q120-20 240 4t160-8v104H0z" fill="#b2dc8c"/>` +
        // big leaves in the corners
        `<g fill="#9ccc65"><ellipse cx="20" cy="40" rx="70" ry="26" transform="rotate(30 20 40)"/><ellipse cx="0" cy="110" rx="60" ry="22" transform="rotate(-10 0 110)"/>` +
        `<ellipse cx="390" cy="30" rx="70" ry="26" transform="rotate(-35 390 30)"/><ellipse cx="400" cy="380" rx="80" ry="28" transform="rotate(-30 400 380)"/>` +
        `<ellipse cx="0" cy="390" rx="80" ry="28" transform="rotate(30 0 390)"/></g>` +
        `<g stroke="#7cb342" stroke-width="4" fill="none"><path d="M-30 10l100 60M-50 115l110-10M440 -10L330 66M460 345L330 420M-60 360l120 60"/></g>`,
    ),
  },
  {
    id: "night",
    say: "Night sky!",
    dark: true,
    svg: S(
      `<defs><linearGradient id="nsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#141b4d"/><stop offset="1" stop-color="#3949ab"/></linearGradient></defs>` +
        `<rect width="400" height="400" fill="url(#nsky)"/>` +
        `<circle cx="300" cy="90" r="40" fill="#fff59d"/><circle cx="318" cy="76" r="36" fill="#1a2260"/>` +
        dots(40, 11, 0, 0, 400, 260, 2.2, "#ffffff") +
        star4(80, 70, 12) +
        star4(180, 140, 9) +
        star4(360, 200, 10) +
        star4(40, 200, 8) +
        `<path d="M0 320q100-40 200-6t200-14v100H0z" fill="#1b2a5a"/>`,
    ),
  },
];

export const sceneById = new Map(SCENES.map((s) => [s.id, s]));

/** Paint a scene into a canvas (cropped to fill it). */
export async function paintScene(c: HTMLCanvasElement, id: string): Promise<void> {
  const ctx = c.getContext("2d")!;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, c.width, c.height);
  const scene = sceneById.get(id);
  if (!scene || id === "paper") return;
  const markup = scene.svg.replace(/^<svg\b/, `<svg width="${c.width}" height="${c.height}"`);
  const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml" }));
  const img = await loadImage(url);
  URL.revokeObjectURL(url);
  if (img) ctx.drawImage(img, 0, 0, c.width, c.height);
}

export function sceneLines(): string[] {
  return SCENES.map((s) => s.say);
}
