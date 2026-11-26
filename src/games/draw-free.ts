/**
 * Free drawing: a crisp full-page canvas with crayon, marker, rainbow brush,
 * glitter, eraser and picture stamps. One stroke per finger, undo, and the
 * drawing is kept on the device so leaving never loses it.
 */
import { byId, type Item } from "../data/items";
import { sfx } from "../lib/sfx";
import { speak } from "../lib/speech";
import { bounce, capitalize, h, icon, pic, pickOne, reward, wiggle } from "../lib/ui";
import {
  brightColor,
  confirmBox,
  crayonSvg,
  dBtn,
  fluent,
  freeDraft,
  hslHex,
  ICONS,
  loadImage,
  newId,
  on,
  PRAISE,
  putEntry,
  putFreeDraft,
  RAINBOW,
  SAY,
  shade,
  svgIcon,
  type FreeEntry,
} from "./draw-shared";
import { palette } from "./draw-palette";

type Brush = "crayon" | "marker" | "rainbow" | "sparkle" | "eraser";
type Tool = Brush | "stamp";

interface LineOp {
  t: "line";
  b: Brush;
  c: string;
  /** Width as a fraction of the paper's short side. */
  w: number;
  /** Points as fractions of the paper: x0, y0, x1, y1, … */
  p: number[];
  seed: number;
}

interface StampOp {
  t: "stamp";
  k: string;
  x: number;
  y: number;
  /** Size as a fraction of the paper's short side. */
  s: number;
  rot: number;
}

type Op = LineOp | StampOp;

// ---------------------------------------------------------------------------
// Stamps (pictures from the app's own catalog)

interface StampDef {
  key: string;
  say: string;
  face: () => HTMLElement;
  /** Where the picture comes from: an image URL or inline SVG markup. */
  src: () => { url?: string; svg?: string; emoji?: string };
}

function fromEl(el: HTMLElement): { url?: string; svg?: string; emoji?: string } {
  const img = el.tagName === "IMG" ? (el as HTMLImageElement) : el.querySelector("img");
  if (img) return { url: img.src };
  const svg = el.querySelector("svg");
  if (svg) return { svg: svg.outerHTML };
  return { emoji: el.textContent ?? "⭐" };
}

const itemStamp = (id: string): StampDef | null => {
  const it: Item | undefined = byId.get(id);
  if (!it) return null;
  return { key: id, say: `${capitalize(it.name)}!`, face: () => pic(it), src: () => fromEl(pic(it)) };
};

const glyphStamp = (glyph: string, say: string): StampDef => ({
  key: glyph,
  say,
  face: () => h("span", { class: "pic art" }, icon(glyph)),
  src: () => fromEl(icon(glyph)),
});

export const STAMPS: StampDef[] = [
  ...["dumptruck", "excavator", "firetruck", "tractor", "racecar", "monster", "trex", "triceratops", "cow", "pig", "dog", "cat", "lion"].map(itemStamp),
  glyphStamp("☀️", "Sun!"),
  glyphStamp("⭐", "Star!"),
  glyphStamp("❤️", "Heart!"),
  glyphStamp("🌹", "Flower!"),
  glyphStamp("🌳", "Tree!"),
].filter((s): s is StampDef => !!s);

const stampImages = new Map<string, Promise<CanvasImageSource | string | null>>();

function stampImage(def: StampDef): Promise<CanvasImageSource | string | null> {
  let p = stampImages.get(def.key);
  if (p) return p;
  const s = def.src();
  if (s.url) p = loadImage(s.url);
  else if (s.svg) {
    const markup = s.svg.replace(/^<svg\b/, '<svg width="400" height="400"');
    const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml" }));
    p = loadImage(url).then((img) => {
      URL.revokeObjectURL(url);
      return img;
    });
  } else p = Promise.resolve(s.emoji ?? null);
  stampImages.set(def.key, p);
  return p;
}

// ---------------------------------------------------------------------------
// Brush rendering (deterministic, so undo can replay every stroke exactly)

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Crayon grain: the color with little holes where the paper shows through. */
const grainTiles = new Map<string, HTMLCanvasElement>();
function grainTile(color: string): HTMLCanvasElement {
  let t = grainTiles.get(color);
  if (t) return t;
  t = document.createElement("canvas");
  t.width = t.height = 96;
  const g = t.getContext("2d")!;
  g.fillStyle = color;
  g.fillRect(0, 0, 96, 96);
  const d = g.getImageData(0, 0, 96, 96);
  const r = rng(color.length * 977 + parseInt(color.slice(1), 16));
  for (let i = 0; i < d.data.length; i += 4) {
    const v = r();
    // Streaky grain: neighbours along a row tend to match.
    if (v < 0.13) d.data[i + 3] = 0;
    else if (v < 0.3) d.data[i + 3] = 120;
    else if (v < 0.36) {
      d.data[i] *= 0.85;
      d.data[i + 1] *= 0.85;
      d.data[i + 2] *= 0.85;
    }
  }
  g.putImageData(d, 0, 0);
  grainTiles.set(color, t);
  return t;
}

const patterns = new WeakMap<CanvasRenderingContext2D, Map<string, CanvasPattern | null>>();
function grain(ctx: CanvasRenderingContext2D, color: string): CanvasPattern | string {
  let m = patterns.get(ctx);
  if (!m) patterns.set(ctx, (m = new Map()));
  if (!m.has(color)) m.set(color, ctx.createPattern(grainTile(color), "repeat"));
  return m.get(color) ?? color;
}

interface LineState {
  rnd: () => number;
  dist: number;
  acc: number;
  hue: number;
}

const newState = (op: LineOp): LineState => {
  const rnd = rng(op.seed);
  return { rnd, dist: 0, acc: 0, hue: rnd() * 360 };
};

function sparkleStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

class Painter {
  W = 0;
  H = 0;
  constructor(public stampFor: (key: string) => CanvasImageSource | string | null) {}

  get min() {
    return Math.min(this.W, this.H);
  }

  pt(op: LineOp, i: number) {
    return { x: op.p[i * 2] * this.W, y: op.p[i * 2 + 1] * this.H };
  }

  width(op: LineOp) {
    return op.w * this.min;
  }

  /** Draw the piece of the stroke that point i adds. */
  seg(ctx: CanvasRenderingContext2D, op: LineOp, st: LineState, i: number) {
    const w = this.width(op);
    const P = this.pt(op, i);
    if (op.b === "sparkle") {
      const A = i ? this.pt(op, i - 1) : P;
      this.glitter(ctx, op, st, A, P, w, i === 0);
      return;
    }
    if (i === 0) {
      this.style(ctx, op, st, w);
      ctx.beginPath();
      ctx.arc(P.x, P.y, w / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    const B = this.pt(op, i - 1);
    st.dist += Math.hypot(P.x - B.x, P.y - B.y);
    const from = i === 1 ? B : mid(this.pt(op, i - 2), B);
    const to = mid(B, P);
    this.style(ctx, op, st, w);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.quadraticCurveTo(B.x, B.y, to.x, to.y);
    ctx.stroke();
  }

  /** The last little bit of the stroke, up to the finger. */
  finish(ctx: CanvasRenderingContext2D, op: LineOp, st: LineState) {
    const n = op.p.length / 2;
    if (n < 2 || op.b === "sparkle") return;
    const w = this.width(op);
    const A = mid(this.pt(op, n - 2), this.pt(op, n - 1));
    const B = this.pt(op, n - 1);
    this.style(ctx, op, st, w);
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.stroke();
  }

  style(ctx: CanvasRenderingContext2D, op: LineOp, st: LineState, w: number) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = w;
    ctx.globalAlpha = 1;
    let c: string | CanvasPattern = op.c;
    if (op.b === "rainbow") c = hslHex((st.hue + st.dist * 0.45) % 360, 92, 56);
    else if (op.b === "crayon") {
      c = grain(ctx, op.c);
      ctx.globalAlpha = 0.95;
    }
    ctx.strokeStyle = c;
    ctx.fillStyle = c;
  }

  glitter(ctx: CanvasRenderingContext2D, op: LineOp, st: LineState, A: { x: number; y: number }, B: { x: number; y: number }, w: number, first: boolean) {
    const len = Math.hypot(B.x - A.x, B.y - A.y);
    const gap = Math.max(2, w * 0.13);
    st.acc += len;
    if (first) st.acc = gap;
    const colors = [op.c, shade(op.c, 0.75), lighten(op.c), "#ffc928", op.c];
    while (st.acc >= gap) {
      st.acc -= gap;
      const f = len ? 1 - st.acc / len : 0;
      const x = A.x + (B.x - A.x) * f;
      const y = A.y + (B.y - A.y) * f;
      for (let k = 0; k < 3; k++) {
        const a = st.rnd() * Math.PI * 2;
        const rr = Math.sqrt(st.rnd()) * w * (k === 2 ? 0.35 : 0.55);
        const px = x + Math.cos(a) * rr;
        const py = y + Math.sin(a) * rr;
        const v = st.rnd();
        ctx.globalAlpha = 0.75 + st.rnd() * 0.25;
        ctx.fillStyle = colors[v < 0.42 ? 0 : v < 0.58 ? 1 : v < 0.74 ? 2 : v < 0.87 ? 3 : 4];
        if (st.rnd() < 0.06) {
          ctx.globalAlpha = 1;
          ctx.fillStyle = st.rnd() < 0.6 ? "#ffc928" : lighten(op.c);
          sparkleStar(ctx, px, py, w * (0.28 + st.rnd() * 0.2));
        } else {
          ctx.beginPath();
          ctx.arc(px, py, w * (0.05 + st.rnd() * 0.08), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  stamp(ctx: CanvasRenderingContext2D, op: StampOp) {
    const img = this.stampFor(op.k);
    if (!img) return;
    const s = op.s * this.min;
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.translate(op.x * this.W, op.y * this.H);
    ctx.rotate(op.rot);
    if (typeof img === "string") {
      ctx.font = `${s * 0.85}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(img, 0, 0);
    } else {
      const iw = (img as HTMLImageElement).naturalWidth || 1;
      const ih = (img as HTMLImageElement).naturalHeight || 1;
      const k = s / Math.max(iw, ih);
      ctx.drawImage(img, (-iw * k) / 2, (-ih * k) / 2, iw * k, ih * k);
    }
    ctx.restore();
  }

  op(ctx: CanvasRenderingContext2D, op: Op) {
    if (op.t === "stamp") return this.stamp(ctx, op);
    const st = newState(op);
    const n = op.p.length / 2;
    for (let i = 0; i < n; i++) this.seg(ctx, op, st, i);
    this.finish(ctx, op, st);
  }
}

const mid = (a: { x: number; y: number }, b: { x: number; y: number }) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

function lighten(hex: string): string {
  if (!hex.startsWith("#")) return "#ffffff";
  const n = parseInt(hex.slice(1), 16);
  const m = (v: number) => Math.round(v + (255 - v) * 0.55);
  return `#${((m((n >> 16) & 255) << 16) | (m((n >> 8) & 255) << 8) | m(n & 255)).toString(16).padStart(6, "0")}`;
}

// ---------------------------------------------------------------------------
// The studio

export interface FreeOpts {
  signal: AbortSignal;
  alive: () => boolean;
  back: () => void;
  /** Keep drawing on a saved picture. */
  entry?: FreeEntry;
}

const BRUSHES: { id: Tool; label: string; say: string; face: () => HTMLElement }[] = [
  { id: "crayon", label: "Crayon", say: SAY.crayon, face: () => svgIcon("", "d-crayon-ico") },
  { id: "marker", label: "Marker", say: SAY.marker, face: () => svgIcon(ICONS.marker) },
  { id: "rainbow", label: "Rainbow brush", say: SAY.rainbowBrush, face: () => svgIcon(ICONS.rainbowBrush) },
  { id: "sparkle", label: "Sparkles", say: SAY.sparkle, face: () => svgIcon(ICONS.sparkle) },
  { id: "eraser", label: "Eraser", say: SAY.eraser, face: () => svgIcon(ICONS.eraser) },
  { id: "stamp", label: "Stamps", say: SAY.stamps, face: () => svgIcon(ICONS.stamp) },
];

/** Brush width (fraction of the short side) for [thin, fat]. */
const WIDTH: Record<Brush, [number, number]> = {
  crayon: [0.022, 0.05],
  marker: [0.032, 0.075],
  rainbow: [0.03, 0.07],
  sparkle: [0.05, 0.1],
  eraser: [0.05, 0.12],
};
const STAMP_SIZE: [number, number] = [0.16, 0.28];

/** Remembered while the app is open. */
let lastTool: Tool = "crayon";
let lastBrush: Brush = "crayon";
let lastStamp = STAMPS[0]?.key ?? "";
let toldFree = false;
let toldStamps = false;

const MAX_OPS = 40;

export function freeDraw(root: HTMLElement, o: FreeOpts) {
  const { signal } = o;
  let tool: Tool = lastTool;
  let stampKey = lastStamp;

  // ---- what we start from: the draft, or a saved picture to keep going on
  let draft = freeDraft();
  let entryId: string | undefined = draft?.entry;
  let changes = draft?.dirty ?? 0;
  let source: { img: string; w: number; h: number } | null = draft;
  if (o.entry) {
    if (draft && draft.dirty > 0 && draft.entry !== o.entry.id) {
      putEntry({ id: draft.entry ?? newId(), t: Date.now(), kind: "free", img: draft.img, w: draft.w, h: draft.h });
    }
    source = o.entry;
    entryId = o.entry.id;
    changes = 0;
    draft = null;
  }

  // ---- canvas
  const cv = h("canvas", { class: "fd-canvas", "aria-label": "Drawing paper" });
  const ctx = cv.getContext("2d")!;
  const base = document.createElement("canvas");
  const bctx = base.getContext("2d")!;
  const cell = h("div", { class: "d-paper-cell fd-cell" }, h("div", { class: "fd-paper" }, cv));
  const paper = cell.firstElementChild as HTMLElement;
  let k = 1;
  let ready = false;
  const loaded = new Map<string, CanvasImageSource | string | null>();
  const painter = new Painter((key) => loaded.get(key) ?? null);
  let ops: Op[] = [];
  const pending = new Set<Op>();

  function setup(cw: number, ch: number) {
    const aspect = source ? source.w / source.h : cw / ch;
    const W = Math.min(cw, ch * aspect);
    const H = W / aspect;
    painter.W = W;
    painter.H = H;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    k = Math.min(dpr, Math.sqrt(4_200_000 / (W * H)));
    cv.width = base.width = Math.round(W * k);
    cv.height = base.height = Math.round(H * k);
    place(cw, ch);
    bctx.fillStyle = "#fff";
    bctx.fillRect(0, 0, base.width, base.height);
    redraw();
    ready = true;
    if (source) {
      const src = source;
      void loadImage(src.img).then((img) => {
        if (!img || !o.alive()) return;
        bctx.drawImage(img, 0, 0, base.width, base.height);
        redraw();
      });
    }
  }

  /** Fit the paper (fixed aspect) into its cell. */
  function place(cw: number, ch: number) {
    const aspect = painter.W / painter.H;
    const w = Math.min(cw, ch * aspect);
    paper.style.width = `${Math.floor(w)}px`;
    paper.style.height = `${Math.floor(w / aspect)}px`;
  }

  function redraw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.drawImage(base, 0, 0);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    for (const op of ops) if (!pending.has(op)) painter.op(ctx, op);
  }

  /** Too many steps to undo: paint the oldest into the paper for good. */
  function bake() {
    while (ops.length > MAX_OPS && !liveOps.has(ops[0])) {
      const op = ops.shift()!;
      bctx.setTransform(k, 0, 0, k, 0, 0);
      painter.op(bctx, op);
      bctx.setTransform(1, 0, 0, 1, 0, 0);
    }
  }

  const ro = new ResizeObserver(() => {
    const r = cell.getBoundingClientRect();
    if (r.width < 20 || r.height < 20) return;
    if (!ready) setup(r.width, r.height);
    else place(r.width, r.height);
  });
  ro.observe(cell);

  // ---- saving
  let saveTimer = 0;
  let savedChanges = changes;
  function snapshot(max: number, q: number): string | null {
    try {
      const s = Math.min(1, max / Math.max(cv.width, cv.height));
      const c = document.createElement("canvas");
      c.width = Math.round(cv.width * s);
      c.height = Math.round(cv.height * s);
      c.getContext("2d")!.drawImage(cv, 0, 0, c.width, c.height);
      return c.toDataURL("image/jpeg", q);
    } catch {
      return null;
    }
  }
  function saveDraft() {
    clearTimeout(saveTimer);
    if (!ready || live.size) return;
    const img = snapshot(1400, 0.86);
    if (img) putFreeDraft({ img, w: painter.W, h: painter.H, entry: entryId, dirty: changes });
    savedChanges = changes;
  }
  const scheduleSave = () => {
    clearTimeout(saveTimer);
    saveTimer = window.setTimeout(saveDraft, 1200);
  };
  function saveToGallery(): boolean {
    const img = snapshot(900, 0.82);
    if (!img) return false;
    entryId ??= newId();
    const ok = putEntry({ id: entryId, t: Date.now(), kind: "free", img, w: painter.W, h: painter.H });
    changes = 0;
    saveDraft();
    return ok;
  }

  // ---- drawing
  const live = new Map<number, { op: LineOp; st: LineState }>();
  const liveOps = new Set<Op>();

  const pos = (e: PointerEvent) => {
    const r = cv.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height] as const;
  };

  on(
    cv,
    "pointerdown",
    (e: PointerEvent) => {
      if (!ready) return;
      e.preventDefault();
      const [x, y] = pos(e);
      if (tool === "stamp") {
        stampAt(x, y);
        return;
      }
      try {
        cv.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      const b = tool;
      const picked = pal.color();
      const c = b === "eraser" ? "#ffffff" : picked === RAINBOW ? brightColor() : picked;
      const op: LineOp = { t: "line", b, c, w: WIDTH[b][pal.size()], p: [x, y], seed: (Math.random() * 2 ** 31) | 0 };
      const st = newState(op);
      ops.push(op);
      liveOps.add(op);
      live.set(e.pointerId, { op, st });
      ctx.setTransform(k, 0, 0, k, 0, 0);
      painter.seg(ctx, op, st, 0);
    },
    signal,
  );

  on(
    cv,
    "pointermove",
    (e: PointerEvent) => {
      const s = live.get(e.pointerId);
      if (!s) return;
      e.preventDefault();
      const evs = e.getCoalescedEvents?.().length ? e.getCoalescedEvents() : [e];
      ctx.setTransform(k, 0, 0, k, 0, 0);
      for (const ev of evs) {
        const [x, y] = pos(ev);
        const n = s.op.p.length;
        const dx = (x - s.op.p[n - 2]) * painter.W;
        const dy = (y - s.op.p[n - 1]) * painter.H;
        if (dx * dx + dy * dy < 2.5) continue;
        s.op.p.push(x, y);
        painter.seg(ctx, s.op, s.st, s.op.p.length / 2 - 1);
      }
    },
    signal,
  );

  const end = (e: PointerEvent) => {
    const s = live.get(e.pointerId);
    if (!s) return;
    live.delete(e.pointerId);
    liveOps.delete(s.op);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    painter.finish(ctx, s.op, s.st);
    changes++;
    bake();
    scheduleSave();
  };
  on(cv, "pointerup", end, signal);
  on(cv, "pointercancel", end, signal);
  on(cv, "contextmenu", (e: Event) => e.preventDefault(), signal);

  function stampAt(x: number, y: number) {
    const def = STAMPS.find((s) => s.key === stampKey);
    const img = loaded.get(stampKey);
    if (!def || !img) {
      void ensureStamp(stampKey);
      return;
    }
    const op: StampOp = { t: "stamp", k: stampKey, x, y, s: STAMP_SIZE[pal.size()], rot: (Math.random() - 0.5) * 0.35 };
    ops.push(op);
    pending.add(op);
    sfx.pop();
    // A quick pop-in on top, then it's printed onto the paper.
    const r = cv.getBoundingClientRect();
    const px = op.s * Math.min(r.width, r.height);
    const fx = h("div", { class: "fd-stamp-pop", style: `left:${x * r.width}px;top:${y * r.height}px;width:${px}px;height:${px}px;--rot:${op.rot}rad` }, def.face());
    paper.append(fx);
    setTimeout(() => {
      fx.remove();
      if (!pending.delete(op) || !ops.includes(op)) return;
      ctx.setTransform(k, 0, 0, k, 0, 0);
      painter.stamp(ctx, op);
    }, 260);
    changes++;
    bake();
    scheduleSave();
  }

  async function ensureStamp(key: string) {
    const def = STAMPS.find((s) => s.key === key);
    if (!def || loaded.has(key)) return;
    const img = await stampImage(def);
    loaded.set(key, img);
  }

  // ---- controls
  const pal = palette({
    signal,
    sizes: true,
    onPick: () => {
      if (tool === "eraser" || tool === "stamp") setTool(lastBrush === "eraser" ? "crayon" : lastBrush, false);
      updateFaces();
    },
  });

  const brushBtns = new Map<Tool, HTMLButtonElement>();
  const brushes = h("div", { class: "d-brushes" });
  for (const b of BRUSHES) {
    const btn = dBtn(b.face(), b.label, () => {
      bounce(btn);
      setTool(b.id, true);
    }, `d-brush d-brush-${b.id}`);
    brushBtns.set(b.id, btn);
    brushes.append(btn);
  }

  const tray = h("div", { class: "d-tray hidden" });
  const stampBtns = new Map<string, HTMLButtonElement>();
  for (const s of STAMPS) {
    const b = h("button", { class: "d-stamp", "aria-label": s.say.replace("!", "") }, s.face());
    b.addEventListener("click", () => {
      sfx.tap();
      bounce(b);
      stampKey = lastStamp = s.key;
      void ensureStamp(s.key);
      stampBtns.forEach((x, key) => x.classList.toggle("sel", key === s.key));
      void speak(s.say);
    });
    stampBtns.set(s.key, b);
    tray.append(b);
  }
  stampBtns.get(stampKey)?.classList.add("sel");

  function setTool(t: Tool, say: boolean) {
    tool = lastTool = t;
    if (t !== "stamp") lastBrush = t;
    brushBtns.forEach((b, id) => b.classList.toggle("sel", id === t));
    tray.classList.toggle("hidden", t !== "stamp");
    pal.el.classList.toggle("hidden", t === "stamp");
    cv.classList.toggle("stamping", t === "stamp");
    if (t === "stamp") {
      STAMPS.forEach((s) => void ensureStamp(s.key));
      if (say && !toldStamps) {
        toldStamps = true;
        void speak(SAY.stamps);
      } else if (say) void speak(STAMPS.find((s) => s.key === stampKey)?.say ?? "");
    } else if (say) void speak(BRUSHES.find((b) => b.id === t)!.say);
  }

  function updateFaces() {
    const c = pal.color();
    const crayonFace = brushBtns.get("crayon")?.querySelector(".d-crayon-ico");
    if (crayonFace) crayonFace.innerHTML = crayonSvg(c);
    brushes.style.setProperty("--c", c === RAINBOW ? "#ff7043" : c === "#ffffff" ? "#f5f5f5" : c);
  }

  const undoBtn = dBtn(svgIcon(ICONS.undo), "Undo", () => {
    if (live.size) return;
    const op = ops.pop();
    if (!op) {
      wiggle(undoBtn);
      return;
    }
    pending.delete(op);
    paper.querySelectorAll(".fd-stamp-pop").forEach((x) => x.remove());
    redraw();
    changes++;
    scheduleSave();
  });

  const newBtn = dBtn(svgIcon(ICONS.newPage), "New page", () => {
    if (live.size) return;
    confirmBox({
      say: SAY.askNew,
      face: svgIcon(ICONS.newPage),
      signal,
      yes: () => {
        // Nothing is ever lost: an unsaved drawing goes to the gallery first.
        if (changes > 0 && (ops.length || source)) saveToGallery();
        ops = [];
        pending.clear();
        source = null;
        entryId = undefined;
        changes = 0;
        bctx.setTransform(1, 0, 0, 1, 0, 0);
        bctx.fillStyle = "#fff";
        bctx.fillRect(0, 0, base.width, base.height);
        redraw();
        putFreeDraft(null);
        savedChanges = 0;
        bounce(paper);
        sfx.whoosh();
        void speak(SAY.newPage);
      },
    });
  });

  const doneBtn = dBtn(fluent("✅"), "Done", () => {
    if (live.size) return;
    if (changes < 2) {
      wiggle(doneBtn);
      void speak(SAY.drawMore);
      return;
    }
    saveToGallery();
    paper.classList.remove("fd-saved");
    void paper.offsetWidth;
    paper.classList.add("fd-saved");
    void reward(paper);
    void speak(`${pickOne(PRAISE)} ${SAY.saved}`);
  });

  const tools = h(
    "div",
    { class: "d-tools" },
    dBtn(fluent("⬅"), "Back", () => {
      saveDraft();
      o.back();
    }),
    undoBtn,
    h("div", { class: "d-flex" }),
    newBtn,
    doneBtn,
  );

  root.replaceChildren(h("div", { class: "d-studio fd-studio" }, tools, cell, h("div", { class: "d-side" }, brushes, pal.el, tray)));
  setTool(tool, false);
  updateFaces();
  void ensureStamp(stampKey);

  signal.addEventListener("abort", () => {
    ro.disconnect();
    if (changes !== savedChanges || saveTimer) saveDraft();
  });

  if (!toldFree) {
    toldFree = true;
    void speak(SAY.free);
  }
}

export function freeLines(): string[] {
  return STAMPS.map((s) => s.say);
}
