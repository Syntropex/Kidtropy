/**
 * Coloring pages, made from the app's own hand-drawn SVG art: the dark ink
 * outlines and tiny details stay, every other shape turns white and becomes a
 * tappable region that fills with the chosen crayon.
 */
import { ART, colorCar, colorTruck, raceCar } from "../art/art";
import { byId } from "../data/items";
import { sfx } from "../lib/sfx";
import { speak } from "../lib/speech";
import { bounce, h, pickOne, reward, wiggle } from "../lib/ui";
import {
  brightColor,
  dBtn,
  fluent,
  ICONS,
  on,
  pageDrafts,
  PRAISE,
  putEntry,
  putPageDraft,
  RAINBOW,
  SAY,
  svgIcon,
  newId,
  type ColorEntry,
  type Fills,
  type PageDraft,
} from "./draw-shared";
import { palette } from "./draw-palette";

const INK = "#2b2b3a";
/** Small colored details become a soft shadow so they show on any color. */
const SHADOW = "rgba(43,43,58,.18)";
const WHITE = "#ffffff";

export interface Page {
  id: string;
  name: string;
  svg: string;
}

const named = (id: string, fallback: string) => byId.get(id)?.name ?? fallback;

export const PAGES: Page[] = [
  { id: "excavator", name: named("excavator", "excavator"), svg: ART.excavator },
  { id: "dumptruck", name: named("dumptruck", "dump truck"), svg: ART.dumptruck },
  { id: "bulldozer", name: named("bulldozer", "bulldozer"), svg: ART.bulldozer },
  { id: "mixer", name: named("mixer", "cement mixer"), svg: ART.mixer },
  { id: "triceratops", name: named("triceratops", "triceratops"), svg: ART.triceratops },
  { id: "stegosaurus", name: named("stegosaurus", "stegosaurus"), svg: ART.stegosaurus },
  { id: "pterodactyl", name: named("pterodactyl", "pterodactyl"), svg: ART.pterodactyl },
  { id: "racecar", name: "race car", svg: raceCar("#e53935") },
  { id: "monster", name: named("monster", "monster truck"), svg: ART.monster },
  { id: "garbage", name: named("garbage", "garbage truck"), svg: ART.garbage },
  { id: "tow", name: named("tow", "tow truck"), svg: ART.tow },
  { id: "roller", name: named("roller", "road roller"), svg: ART.roller },
  { id: "car", name: "car", svg: colorCar("#1e88e5") },
  { id: "truck", name: "pickup truck", svg: colorTruck("#43a047") },
  { id: "cone", name: named("cone", "traffic cone"), svg: ART.cone },
  { id: "fossil", name: "dinosaur fossil", svg: ART.fossil },
].filter((p) => !!p.svg);

export const pageById = new Map(PAGES.map((p) => [p.id, p]));

export const letsColor = (p: Page) => `Let's color the ${p.name}!`;

// ---------------------------------------------------------------------------
// Turning art into a coloring page

interface Prepared {
  /** Cleaned SVG markup with data-r (region) and data-k ("f" fill / "s" stroke). */
  markup: string;
  n: number;
}

const prepared = new Map<string, Prepared>();

const SHAPES = new Set(["path", "circle", "ellipse", "rect", "polygon", "polyline", "line", "text"]);

function norm(c: string | null): string {
  if (!c) return "none";
  const s = c.trim().toLowerCase();
  if (s === "#fff" || s === "white") return WHITE;
  return s;
}

const isInk = (c: string) => c === INK || c === "#000" || c === "#000000" || c === "black";
const isWhite = (c: string) => c === WHITE;
const isTranslucent = (c: string) => c.startsWith("rgba") || c.startsWith("hsla");

/** The attribute as SVG inheritance sees it (presentation attributes only). */
function eff(el: Element, attr: string): string | null {
  for (let e: Element | null = el; e && e.tagName.toLowerCase() !== "foreignobject"; e = e.parentElement) {
    const v = e.getAttribute(attr);
    if (v != null) return v;
    if (e.tagName.toLowerCase() === "svg") break;
  }
  return null;
}

function opacity(el: Element): number {
  let o = 1;
  for (let e: Element | null = el; e; e = e.parentElement) {
    const v = e.getAttribute("opacity");
    if (v != null) o *= parseFloat(v) || 0;
    if (e.tagName.toLowerCase() === "svg") break;
  }
  return o;
}

let sandbox: HTMLElement | null = null;

/**
 * Classify every shape of the art. Needs the DOM (for getBBox), so it runs in
 * an invisible sandbox once per page and is cached.
 */
export function prepare(page: Page): Prepared {
  const hit = prepared.get(page.id);
  if (hit) return hit;
  sandbox ??= document.body.appendChild(h("div", { style: "position:fixed;left:-9999px;top:0;width:200px;height:200px;visibility:hidden;pointer-events:none", "aria-hidden": "true" }));
  const doc = new DOMParser().parseFromString(page.svg, "image/svg+xml");
  const svg = document.importNode(doc.documentElement, true) as unknown as SVGSVGElement;
  sandbox.replaceChildren(svg);

  type R = { els: SVGGraphicsElement[]; kind: "f" | "s"; outline: boolean };
  const regions: R[] = [];
  const links = new Map<string, R>();

  const all = [...svg.querySelectorAll("*")] as SVGGraphicsElement[];
  for (const el of all) {
    const tag = el.tagName.toLowerCase();
    if (!SHAPES.has(tag)) continue;
    if (el.closest("defs, clipPath, mask")) continue;
    const fill = norm(eff(el, "fill") ?? "black");
    const stroke = norm(eff(el, "stroke"));
    const sw = parseFloat(eff(el, "stroke-width") ?? "1") || 0;
    const op = opacity(el);
    const outlined = stroke !== "none" && isInk(stroke) && sw > 0;
    const keep = () => el.setAttribute("pointer-events", "none");
    // Regions without their own outline are linked to same-colored neighbours
    // in the same transformed group (e.g. the bone's round ends + its bar).
    const linkKey = (c: string) => {
      let g: Element | null = el.parentElement;
      while (g && g !== svg && !g.hasAttribute("transform")) g = g.parentElement;
      return `${c}|${g === svg || !g ? "root" : all.indexOf(g as SVGGraphicsElement)}`;
    };
    const addRegion = (kind: "f" | "s", outline: boolean, color: string) => {
      el.setAttribute("data-k", kind);
      if (outline) {
        regions.push({ els: [el], kind, outline });
        return;
      }
      const key = linkKey(color);
      const r = links.get(key);
      if (r) {
        r.els.push(el);
        return;
      }
      const nr: R = { els: [el], kind, outline };
      links.set(key, nr);
      regions.push(nr);
    };

    if (tag === "text") {
      keep();
      continue;
    }
    if (fill === "none") {
      if (stroke === "none" || isInk(stroke) || isTranslucent(stroke) || sw <= 0) {
        keep();
        continue;
      }
      // A colored bar drawn over a dark twin of itself: a stroke region.
      const d = el.getAttribute("d");
      let twin = false;
      for (let p = el.previousElementSibling; p && d; p = p.previousElementSibling) {
        if (p.getAttribute("d") === d && isInk(norm(eff(p, "stroke"))) && norm(eff(p, "fill")) === "none") {
          twin = true;
          break;
        }
      }
      if (twin && op >= 0.99 && !isWhite(stroke)) {
        addRegion("s", false, stroke);
        el.setAttribute("stroke", WHITE);
        continue;
      }
      keep();
      if (!isWhite(stroke)) el.setAttribute("stroke", SHADOW);
      continue;
    }
    if (isInk(fill) || isTranslucent(fill)) {
      keep();
      continue;
    }
    if (outlined) {
      // Big cartoon eyes stay as they are.
      if (isWhite(fill) && tag === "circle" && parseFloat(el.getAttribute("r") ?? "99") <= 12) {
        keep();
        continue;
      }
      addRegion("f", true, fill);
      el.setAttribute("fill", WHITE);
      continue;
    }
    // Filled, no outline: shines, glints, spots, stripes.
    let size = 0;
    try {
      const b = el.getBBox();
      size = Math.max(b.width, b.height);
    } catch {
      size = 0;
    }
    if (isWhite(fill) && (op < 0.99 || size < 18)) {
      keep();
      continue;
    }
    if (op < 0.99 || size < 18) {
      keep();
      el.setAttribute("fill", SHADOW);
      el.removeAttribute("opacity");
      continue;
    }
    addRegion("f", false, fill);
    el.setAttribute("fill", WHITE);
  }

  // Shapes with no outline of their own get a thin one, unless they belong
  // with a bar (whose dark twin already outlines them).
  regions.forEach((r, i) => {
    const hasStroke = r.els.some((e) => e.getAttribute("data-k") === "s");
    for (const e of r.els) {
      e.setAttribute("data-r", String(i));
      if (!r.outline && !hasStroke && e.getAttribute("data-k") === "f") {
        e.setAttribute("stroke", INK);
        e.setAttribute("stroke-width", "3");
      }
    }
  });

  svg.setAttribute("class", "cp-svg");
  const out = { markup: svg.outerHTML, n: regions.length };
  sandbox.replaceChildren();
  prepared.set(page.id, out);
  return out;
}

let uid = 0;

/** A live coloring-page SVG with these fills applied. */
export function renderPage(page: Page, fills: Fills = {}): SVGSVGElement {
  const { markup } = prepare(page);
  // Unique ids (clip paths) per copy, so many copies can share one document.
  const n = ++uid;
  const ids = [...markup.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  let m = markup;
  for (const id of ids) m = m.split(`"${id}"`).join(`"${id}-${n}"`).split(`#${id})`).join(`#${id}-${n})`);
  const tpl = document.createElement("template");
  tpl.innerHTML = m;
  const svg = tpl.content.firstElementChild as SVGSVGElement;
  for (const [r, c] of Object.entries(fills)) paint(svg, Number(r), c);
  return svg;
}

export function paint(svg: SVGSVGElement, region: number, color: string) {
  svg.querySelectorAll(`[data-r="${region}"]`).forEach((e) => e.setAttribute(e.getAttribute("data-k") === "s" ? "stroke" : "fill", color));
}

/** Rasterize a colored page (for sharing / saving as a picture). */
export async function pageToCanvas(page: Page, fills: Fills, size = 1024): Promise<HTMLCanvasElement> {
  const svg = renderPage(page, fills);
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.removeAttribute("class");
  const src = new XMLSerializer().serializeToString(svg);
  const url = URL.createObjectURL(new Blob([src], { type: "image/svg+xml" }));
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = WHITE;
  ctx.fillRect(0, 0, size, size);
  await new Promise<void>((res) => {
    const img = new Image();
    img.onload = () => {
      const pad = size * 0.04;
      ctx.drawImage(img, pad, pad, size - 2 * pad, size - 2 * pad);
      res();
    };
    img.onerror = () => res();
    img.src = url;
  });
  URL.revokeObjectURL(url);
  return c;
}

// ---------------------------------------------------------------------------
// The page picker

export function pagePicker(root: HTMLElement, signal: AbortSignal, back: () => void, open: (p: Page) => void) {
  const drafts = pageDrafts();
  const grid = h("div", { class: "d-fitgrid cp-pick" });
  PAGES.forEach((p, i) => {
    const d = drafts[p.id];
    const started = d && Object.keys(d.fills).length > 0 && d.n === prepare(p).n;
    const face = started ? renderPage(p, d.fills) : h("span", { class: "pic art", html: p.svg });
    const b = h(
      "button",
      { class: `cp-thumb pop-in ${started ? "started" : ""}`, style: `animation-delay:${i * 25}ms`, "aria-label": p.name },
      face,
      started ? svgIcon(ICONS.sparkle, "cp-badge") : null,
    );
    b.addEventListener("click", () => {
      sfx.pop();
      bounce(b);
      setTimeout(() => open(p), 160);
    });
    grid.append(b);
  });
  root.replaceChildren(h("div", { class: "d-screen" }, h("div", { class: "d-bar" }, dBtn(fluent("⬅"), "Back", back)), grid));
  fitSquares(grid, PAGES.length, signal, 14, 200);
  void speak(SAY.pickPage);
}

/** Size a grid of square buttons as big as they fit. */
export function fitSquares(grid: HTMLElement, n: number, signal: AbortSignal, gap = 12, max = 220) {
  const fit = () => {
    const r = grid.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const options: { cell: number; empty: number }[] = [];
    for (let cols = 1; cols <= n; cols++) {
      const rows = Math.ceil(n / cols);
      const cell = Math.min((r.width - (cols - 1) * gap) / cols, (r.height - 16 - (rows - 1) * gap) / rows, max);
      options.push({ cell, empty: cols * rows - n });
    }
    const top = Math.max(...options.map((o) => o.cell));
    // Nearly as big but with no lonely picture on the last row? Prefer that.
    const pickd = options.filter((o) => o.cell >= top * 0.94).sort((x, y) => x.empty - y.empty || y.cell - x.cell)[0];
    grid.style.setProperty("--cell", `${Math.floor(pickd.cell)}px`);
    grid.style.setProperty("--cols", String(options.indexOf(pickd) + 1));
    grid.style.setProperty("--gap", `${gap}px`);
  };
  const ro = new ResizeObserver(fit);
  ro.observe(grid);
  signal.addEventListener("abort", () => ro.disconnect());
  requestAnimationFrame(fit);
}

// ---------------------------------------------------------------------------
// Coloring!

export interface ColorOpts {
  page: Page;
  /** Continue this gallery picture. */
  entry?: ColorEntry;
  signal: AbortSignal;
  alive: () => boolean;
  back: () => void;
  /** After ✅: where to go next. */
  done: () => void;
}

let toldHow = false;

export function colorPage(root: HTMLElement, o: ColorOpts) {
  const { page, signal } = o;
  const prep = prepare(page);
  const drafts = pageDrafts();
  let draft: PageDraft | undefined = drafts[page.id];
  if (draft && draft.n !== prep.n) draft = undefined;
  let entryId = o.entry?.id ?? draft?.entry;
  // Continuing a gallery picture while a different one was in progress here:
  // tuck the unsaved one into the gallery first so nothing is lost.
  if (o.entry && draft && draft.entry !== o.entry.id && draft.dirty > 0 && Object.keys(draft.fills).length) {
    putEntry({ id: draft.entry ?? newId(), t: Date.now(), kind: "color", page: page.id, n: prep.n, fills: draft.fills });
    draft = undefined;
  }
  const fills: Fills = { ...(o.entry && o.entry.n === prep.n ? o.entry.fills : draft?.fills ?? {}) };
  let dirty = o.entry ? 0 : draft?.dirty ?? 0;
  const history: { r: number; prev: string | undefined }[] = [];

  const svg = renderPage(page, fills);
  const paper = h("div", { class: "cp-paper" }, svg);
  const paperWrap = h("div", { class: "d-paper-cell cp-cell" }, paper);

  const saveDraft = () => putPageDraft(page.id, { fills, n: prep.n, entry: entryId, dirty });

  const pal = palette({ signal, sizes: false });

  const undoBtn = dBtn(svgIcon(ICONS.undo), "Undo", () => {
    const last = history.pop();
    if (!last) {
      wiggle(undoBtn);
      return;
    }
    if (last.prev) fills[last.r] = last.prev;
    else delete fills[last.r];
    paint(svg, last.r, last.prev ?? WHITE);
    dirty++;
    saveDraft();
    bounce(paper);
  });

  const doneBtn = dBtn(fluent("✅"), "Done", () => {
    const colored = Object.keys(fills).length;
    if (colored < 2 || (dirty === 0 && entryId)) {
      wiggle(doneBtn);
      void speak(SAY.more);
      return;
    }
    entryId ??= newId();
    putEntry({ id: entryId, t: Date.now(), kind: "color", page: page.id, n: prep.n, fills: { ...fills } });
    putPageDraft(page.id, null);
    dirty = 0;
    finished = true;
    paper.classList.add("cp-framed");
    void reward(paper);
    void speak(`${pickOne(PRAISE)} ${SAY.saved}`);
    setTimeout(() => {
      if (o.alive()) o.done();
    }, 2600);
  });

  let finished = false;

  const tools = h("div", { class: "d-tools" }, dBtn(fluent("⬅"), "Back", o.back), undoBtn, h("div", { class: "d-flex" }), doneBtn);
  root.replaceChildren(h("div", { class: "d-studio cp-studio" }, tools, paperWrap, h("div", { class: "d-side" }, pal.el)));

  on(
    svg,
    "pointerdown",
    (e: PointerEvent) => {
      if (finished) return;
      const t = (e.target as Element).closest?.("[data-r]");
      if (!t) return;
      e.preventDefault();
      const r = Number(t.getAttribute("data-r"));
      const c = pal.color() === RAINBOW ? brightColor() : pal.color();
      if (fills[r] === c) {
        bounceRegion(svg, r);
        return;
      }
      history.push({ r, prev: fills[r] });
      if (history.length > 60) history.shift();
      fills[r] = c;
      paint(svg, r, c);
      dirty++;
      sfx.pop();
      bounceRegion(svg, r);
      ripple(paper, e, c);
      saveDraft();
    },
    signal,
  );

  if (!toldHow) {
    toldHow = true;
    void speak(`${letsColor(page)} ${SAY.tapToColor}`);
  } else void speak(letsColor(page));
}

function bounceRegion(svg: SVGSVGElement, r: number) {
  svg.querySelectorAll(`[data-r="${r}"]`).forEach((e) => {
    e.classList.remove("cp-pop");
    void (e as SVGGraphicsElement).getBoundingClientRect();
    e.classList.add("cp-pop");
  });
}

function ripple(paper: HTMLElement, e: PointerEvent, color: string) {
  const r = paper.getBoundingClientRect();
  const dot = h("i", { class: "cp-ripple", style: `left:${e.clientX - r.left}px;top:${e.clientY - r.top}px;--c:${color}` });
  paper.append(dot);
  setTimeout(() => dot.remove(), 600);
}

export function colorLines(): string[] {
  return PAGES.map(letsColor);
}
