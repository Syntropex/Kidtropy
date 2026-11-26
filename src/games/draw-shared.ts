/**
 * Drawing studio: the bits every mode shares — the crayon palette, the words
 * we say, hand-drawn tool icons, and the art gallery kept on this device.
 */
import { sfx } from "../lib/sfx";
import { speak } from "../lib/speech";
import { h, icon } from "../lib/ui";

// ---------------------------------------------------------------------------
// Palette

export interface Crayon {
  id: string;
  /** What we say when it's picked. */
  say: string;
  css: string;
}

export const RAINBOW = "rainbow";

export const PALETTE: Crayon[] = [
  { id: "red", say: "Red!", css: "#e53935" },
  { id: "orange", say: "Orange!", css: "#fb8c00" },
  { id: "yellow", say: "Yellow!", css: "#fdd835" },
  { id: "green", say: "Green!", css: "#43a047" },
  { id: "lightblue", say: "Light blue!", css: "#4fc3f7" },
  { id: "blue", say: "Blue!", css: "#1e63d6" },
  { id: "purple", say: "Purple!", css: "#8e24aa" },
  { id: "pink", say: "Pink!", css: "#f06292" },
  { id: "brown", say: "Brown!", css: "#8d5a2b" },
  { id: "gray", say: "Gray!", css: "#9e9e9e" },
  { id: "black", say: "Black!", css: "#2f2f38" },
  { id: "white", say: "White!", css: "#ffffff" },
  { id: RAINBOW, say: "Rainbow!", css: RAINBOW },
];

/** A fresh bright color for the 🌈 crayon (never too close to the last one). */
let lastHue = Math.random() * 360;
export function brightColor(): string {
  lastHue = (lastHue + 70 + Math.random() * 150) % 360;
  const l = 52 + Math.random() * 10;
  return hslHex(lastHue, 88, l);
}

export function hslHex(hh: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + hh / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const x = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${x(f(0))}${x(f(8))}${x(f(4))}`;
}

/** Darker shade of a #rrggbb color (for crayon wrappers). */
export function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  const r = c((n >> 16) & 255);
  const g = c((n >> 8) & 255);
  const b = c(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

// ---------------------------------------------------------------------------
// Words (every sentence must be listed in SAY so it can be pre-recorded)

export const SAY = {
  hello: "Let's draw!",
  pickPage: "Pick a picture to color!",
  tapToColor: "Tap a part to color it!",
  free: "Draw anything you like!",
  gallery: "Here is all your art!",
  galleryEmpty: "No pictures yet. Let's make one!",
  saved: "I put it in your art gallery.",
  newPage: "A fresh new page!",
  askNew: "Start a new page?",
  askDelete: "Throw this picture away?",
  more: "Color some more first!",
  drawMore: "Draw some more first!",
  stamps: "Stamps! Tap the page to stamp.",
  crayon: "Crayon!",
  marker: "Marker!",
  rainbowBrush: "Rainbow brush!",
  sparkle: "Sparkles!",
  eraser: "Eraser!",
  thin: "Thin!",
  fat: "Fat!",
};

export const PRAISE = [
  "Beautiful!",
  "What a great picture!",
  "I love your colors!",
  "You're a real artist!",
  "Wow, so colorful!",
  "That looks amazing!",
];

// ---------------------------------------------------------------------------
// Little UI helpers

/** addEventListener that goes away when the game is left. */
export function on(target: EventTarget, type: string, fn: (e: any) => void, signal: AbortSignal, opts: AddEventListenerOptions = {}) {
  target.addEventListener(type, fn, { ...opts, signal });
}

/** Inline SVG icon element from markup. */
export function svgIcon(markup: string, cls = ""): HTMLElement {
  return h("span", { class: `d-svg ${cls}`, html: markup, "aria-hidden": "true" });
}

/** A big round studio button (≥ 64px) with a picture on it. */
export function dBtn(face: Node, label: string, onclick: (e: MouseEvent) => void, cls = ""): HTMLButtonElement {
  const b = h("button", { class: `d-btn ${cls}`, "aria-label": label, title: label }, face);
  b.addEventListener("click", (e) => {
    sfx.tap();
    onclick(e);
  });
  return b;
}

export const fluent = (glyph: string) => icon(glyph);

/**
 * "Are you sure?" for little hands: a big picture of what will happen, a
 * green ✅ and a red ❌. Tapping outside is the same as ❌.
 */
export function confirmBox(o: { say: string; face: Node; yes: () => void; signal: AbortSignal; danger?: boolean }) {
  const close = () => {
    overlay.classList.add("leaving");
    setTimeout(() => overlay.remove(), 250);
  };
  const yes = dBtn(fluent("✅"), "Yes", () => {
    close();
    o.yes();
  }, "d-yes");
  const no = dBtn(svgIcon(ICONS.no), "No", close, "d-no");
  const card = h("div", { class: `d-confirm ${o.danger ? "danger" : ""}`, role: "dialog", "aria-label": o.say }, h("div", { class: "d-confirm-face" }, o.face), h("div", { class: "d-confirm-row" }, no, yes));
  const overlay = h("div", { class: "overlay d-overlay" }, card);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  o.signal.addEventListener("abort", () => overlay.remove());
  document.body.append(overlay);
  void speak(o.say);
}

/** The hand-drawn crayon used in the palette (and as the crayon brush icon). */
let gradN = 0;
export function crayonSvg(css: string): string {
  const id = `d-rb${gradN++}`;
  const rainbow = css === RAINBOW;
  const body = rainbow ? `url(#${id})` : css;
  const wrap = rainbow ? "#ffffff" : shade(css, 0.78);
  const tip = rainbow ? `url(#${id})` : shade(css, 0.9);
  const defs = rainbow
    ? `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">` +
      ["#ff5252", "#ff9800", "#ffeb3b", "#4caf50", "#29b6f6", "#7e57c2"]
        .map((c, i) => `<stop offset="${(i / 5).toFixed(2)}" stop-color="${c}"/>`)
        .join("") +
      `</linearGradient></defs>`
    : "";
  return (
    `<svg viewBox="0 0 44 100" xmlns="http://www.w3.org/2000/svg" stroke="#2b2b3a" stroke-width="3.5" stroke-linejoin="round">${defs}` +
    `<path d="M9 34 L19 7 Q22 2 25 7 L35 34 Z" fill="${tip}"/>` +
    `<rect x="7" y="32" width="30" height="64" rx="5" fill="${body}"/>` +
    `<rect x="7" y="48" width="30" height="32" fill="${wrap}"/>` +
    `<path d="M13 56h18M13 72h18" stroke="${rainbow ? "#bbb" : shade(css, 0.6)}" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M13 38v6" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".55"/>` +
    `</svg>`
  );
}

const S = (inner: string, vb = "0 0 100 100") =>
  `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#2b2b3a" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">${inner}</svg>`;

/** A thick colored line with a dark outline (two strokes). */
const bar = (d: string, c: string, w: number) => `<path d="${d}" stroke-width="${w + 10}"/><path d="${d}" stroke="${c}" stroke-width="${w}"/>`;

export const ICONS = {
  undo: S(bar("M38 30h22a20 20 0 0 1 0 40H34", "#ffb300", 12) + `<path d="M44 12L18 30l26 18z" fill="#ffb300"/>`),
  trash: S(
    `<path d="M24 32h52l-6 58H30z" fill="#4fc3f7"/><path d="M40 44v34M60 44v34" stroke-width="5"/>` +
      `<rect x="16" y="20" width="68" height="12" rx="5" fill="#29b6f6"/><path d="M40 20v-8h20v8" fill="#29b6f6"/>`,
  ),
  frame: S(
    `<rect x="8" y="14" width="84" height="72" rx="8" fill="#ffb300"/>` +
      `<rect x="20" y="26" width="60" height="48" rx="3" fill="#b3e5fc"/>` +
      `<path d="M20 74l18-24 12 14 10-10 20 20z" fill="#66bb6a" stroke-width="4"/>` +
      `<circle cx="64" cy="40" r="7" fill="#fff176" stroke-width="4"/>`,
  ),
  share: S(
    `<path d="M30 42H22v46h56V42h-8" fill="#fff" />` + bar("M50 62V16", "#43a047", 10) + `<path d="M30 30L50 8l20 22z" fill="#43a047"/>`,
  ),
  newPage: S(
    `<path d="M22 8h40l18 18v66H22z" fill="#fff"/><path d="M62 8v18h18" fill="#e3f2fd"/>` +
      `<path d="M70 52l5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2z" fill="#ffd54f" stroke-width="4"/>`,
  ),
  no: S(`<circle cx="50" cy="50" r="40" fill="#ff5252"/><path d="M34 34l32 32M66 34L34 66" stroke="#fff" stroke-width="11"/>`),
  marker: S(
    `<g transform="rotate(35 50 50)"><rect x="34" y="34" width="32" height="58" rx="8" fill="#eceff1"/>` +
      `<path d="M38 34l4-16h16l4 16z" fill="var(--c, #e53935)"/>` +
      `<rect x="34" y="62" width="32" height="10" fill="var(--c, #e53935)" stroke-width="4"/></g>`,
  ),
  rainbowBrush: S(
    `<path d="M10 80a40 40 0 0 1 80 0" stroke="#ff5252" stroke-width="9"/>` +
      `<path d="M21 80a29 29 0 0 1 58 0" stroke="#ffd740" stroke-width="9"/>` +
      `<path d="M32 80a18 18 0 0 1 36 0" stroke="#40c4ff" stroke-width="9"/>` +
      `<path d="M8 82a42 42 0 0 1 84 0M36 82a14 14 0 0 1 28 0" stroke-width="3"/>`,
  ),
  sparkle: S(
    `<path d="M40 10q4 26 26 30q-22 4-26 30q-4-26-26-30q22-4 26-30z" fill="#ffd740" stroke-width="5"/>` +
      `<path d="M74 52q2 14 14 16q-12 2-14 16q-2-14-14-16q12-2 14-16z" fill="#ff80ab" stroke-width="4"/>` +
      `<circle cx="22" cy="82" r="5" fill="#80d8ff" stroke-width="3"/>`,
  ),
  eraser: S(
    `<g transform="rotate(-30 50 50)"><rect x="14" y="34" width="72" height="34" rx="8" fill="#f8bbd0"/>` +
      `<path d="M50 34v34" stroke-width="5"/><rect x="50" y="34" width="36" height="34" rx="8" fill="#4fc3f7"/></g>`,
  ),
  stamp: S(
    `<path d="M40 50V34a10 10 0 1 1 20 0v16" fill="#ff7043"/><circle cx="50" cy="24" r="14" fill="#ff7043"/>` +
      `<rect x="18" y="50" width="64" height="18" rx="5" fill="#a1887f"/><rect x="22" y="68" width="56" height="10" rx="3" fill="#e53935"/>` +
      `<path d="M30 92h40" stroke="#e53935" stroke-width="7"/>`,
  ),
  dotSmall: S(`<circle cx="50" cy="50" r="12" fill="var(--c, #2b2b3a)" stroke-width="4"/>`),
  dotBig: S(`<circle cx="50" cy="50" r="30" fill="var(--c, #2b2b3a)" stroke-width="5"/>`),
  squiggle: S(
    `<path d="M10 70q14-40 28-10t28-10t24-30" stroke-width="16"/>` +
      `<path d="M10 70q14-40 28-10t28-10t24-30" stroke="url(#d-sq)" stroke-width="9"/>` +
      `<defs><linearGradient id="d-sq" x1="0" x2="1"><stop offset="0" stop-color="#ff5252"/><stop offset=".33" stop-color="#ffd740"/><stop offset=".66" stop-color="#69f0ae"/><stop offset="1" stop-color="#40c4ff"/></linearGradient></defs>`,
  ),
};

// ---------------------------------------------------------------------------
// Storage (this device only; everything wrapped in try/catch)

export type Fills = Record<number, string>;

export interface ColorEntry {
  id: string;
  t: number;
  kind: "color";
  page: string;
  /** Number of regions the page had (so changed art doesn't mis-paint). */
  n: number;
  fills: Fills;
}

export interface FreeEntry {
  id: string;
  t: number;
  kind: "free";
  img: string;
  w: number;
  h: number;
}

export type Entry = ColorEntry | FreeEntry;

const K_GALLERY = "kidtropy.draw.gallery";
const K_PAGES = "kidtropy.draw.pages";
const K_FREE = "kidtropy.draw.free";

export const MAX_FREE = 12;
const MAX_COLOR = 40;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function remove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export function gallery(): Entry[] {
  const list = read<Entry[]>(K_GALLERY, []);
  return Array.isArray(list) ? list.filter((e) => e && (e.kind === "color" || e.kind === "free")).sort((a, b) => b.t - a.t) : [];
}

/** Save (or update) a picture. Keeps the newest ones and frees space if the device is full. */
export function putEntry(entry: Entry): boolean {
  let list = gallery().filter((e) => e.id !== entry.id);
  list.unshift(entry);
  let free = 0;
  let col = 0;
  list = list.filter((e) => (e.kind === "free" ? ++free <= MAX_FREE : ++col <= MAX_COLOR));
  // Out of room? Drop the oldest drawings until it fits.
  while (!write(K_GALLERY, list)) {
    const i = list.map((e) => e.kind).lastIndexOf("free");
    if (i <= 0) return false;
    list.splice(i, 1);
  }
  return true;
}

export function deleteEntry(id: string) {
  write(
    K_GALLERY,
    gallery().filter((e) => e.id !== id),
  );
}

/** Coloring pages in progress, by page id. */
export interface PageDraft {
  fills: Fills;
  n: number;
  /** The gallery picture this continues, if any. */
  entry?: string;
  /** Fills changed since it was last saved to the gallery. */
  dirty: number;
}

export function pageDrafts(): Record<string, PageDraft> {
  const d = read<Record<string, PageDraft>>(K_PAGES, {});
  return d && typeof d === "object" ? d : {};
}

export function putPageDraft(page: string, draft: PageDraft | null) {
  const all = pageDrafts();
  if (draft) all[page] = draft;
  else delete all[page];
  write(K_PAGES, all);
}

/** The free drawing in progress. */
export interface FreeDraft {
  img: string;
  w: number;
  h: number;
  entry?: string;
  dirty: number;
}

export function freeDraft(): FreeDraft | null {
  const d = read<FreeDraft | null>(K_FREE, null);
  return d && typeof d.img === "string" && d.w > 0 && d.h > 0 ? d : null;
}

export function putFreeDraft(d: FreeDraft | null): boolean {
  if (!d) {
    remove(K_FREE);
    return true;
  }
  return write(K_FREE, d);
}

// ---------------------------------------------------------------------------
// Pictures out (share / download)

export function blobFromCanvas(c: HTMLCanvasElement, type = "image/png", q?: number): Promise<Blob | null> {
  return new Promise((res) => {
    try {
      c.toBlob((b) => res(b), type, q);
    } catch {
      res(null);
    }
  });
}

export function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((res) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });
}

/** Share a picture (iPad/iPhone share sheet) or download it as a PNG. */
export async function shareOrDownload(blob: Blob, name = "kidtropy-art.png") {
  const file = typeof File !== "undefined" ? new File([blob], name, { type: blob.type }) : null;
  const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
  if (file && nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: "My Kidtropy art" });
      return;
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = h("a", { href: url, download: name, style: "display:none" });
  document.body.append(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 2000);
}

/** Speech lines for this module. */
export function sharedLines(): string[] {
  return [...PALETTE.map((c) => c.say), ...Object.values(SAY), ...PRAISE];
}
