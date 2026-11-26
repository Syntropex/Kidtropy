/**
 * Free drawing: a crisp full-page canvas with crayon, marker, rainbow, glow
 * and glitter brushes, picture stamps and stamp trails, an eraser, mirror
 * magic (left/right symmetry) and pictures to draw on. One stroke per finger,
 * undo, and the drawing is kept on the device so leaving never loses it.
 *
 * Layers: a background canvas (the scene) under an ink canvas. The eraser
 * rubs out ink only, so the scene shows through again.
 */
import { sfx } from "../lib/sfx";
import { speak } from "../lib/speech";
import { bounce, h, pickOne, reward, wiggle } from "../lib/ui";
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
import { paintScene, SCENES, sceneById, sceneLines } from "./draw-scenes";
import { stampByKey, stampCats, stampImage, stampLines } from "./draw-stamps";

type Brush = "crayon" | "marker" | "rainbow" | "neon" | "sparkle" | "trail" | "eraser";
type Tool = Brush | "stamp";

interface LineOp {
  t: "line";
  b: Brush;
  c: string;
  /** Width as a fraction of the paper's short side (for trails: the picture size). */
  w: number;
  /** Points as fractions of the paper: x0, y0, x1, y1, … */
  p: number[];
  seed: number;
  /** Stamp-trail picture. */
  k?: string;
  /** Mirror magic: also drawn flipped left/right. */
  m?: boolean;
}

interface StampOp {
  t: "stamp";
  k: string;
  x: number;
  y: number;
  /** Size as a fraction of the paper's short side. */
  s: number;
  rot: number;
  m?: boolean;
}

type Op = LineOp | StampOp;

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
/** One state per drawn copy (the mirrored copy gets its own). */
const newStates = (op: LineOp): LineState[] => (op.m ? [newState(op), newState(op)] : [newState(op)]);

type Pt = { x: number; y: number };
const mid = (a: Pt, b: Pt) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

function lighten(hex: string, k = 0.55): string {
  if (!hex.startsWith("#")) return "#ffffff";
  const n = parseInt(hex.slice(1), 16);
  const m = (v: number) => Math.round(v + (255 - v) * k);
  return `#${((m((n >> 16) & 255) << 16) | (m((n >> 8) & 255) << 8) | m(n & 255)).toString(16).padStart(6, "0")}`;
}

function sparkleStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

type Shape = { dot: Pt } | { from: Pt; ctrl?: Pt; to: Pt };

class Painter {
  W = 0;
  H = 0;
  /** Canvas pixels per paper unit (shadow blur is in pixels). */
  k = 1;
  constructor(public stampFor: (key: string) => CanvasImageSource | string | null) {}

  get min() {
    return Math.min(this.W, this.H);
  }

  pt(op: LineOp, i: number, mir: boolean): Pt {
    const x = op.p[i * 2];
    return { x: (mir ? 1 - x : x) * this.W, y: op.p[i * 2 + 1] * this.H };
  }

  /** Draw the piece of the stroke that point i adds (and its mirror twin). */
  seg(ctx: CanvasRenderingContext2D, op: LineOp, sts: LineState[], i: number) {
    this.seg1(ctx, op, sts[0], i, false);
    if (op.m) this.seg1(ctx, op, sts[1] ?? sts[0], i, true);
  }

  finish(ctx: CanvasRenderingContext2D, op: LineOp, sts: LineState[]) {
    this.finish1(ctx, op, sts[0], false);
    if (op.m) this.finish1(ctx, op, sts[1] ?? sts[0], true);
    this.reset(ctx);
  }

  private seg1(ctx: CanvasRenderingContext2D, op: LineOp, st: LineState, i: number, mir: boolean) {
    const w = op.w * this.min;
    const P = this.pt(op, i, mir);
    const A = i ? this.pt(op, i - 1, mir) : P;
    if (op.b === "sparkle") return this.glitter(ctx, op, st, A, P, w, i === 0);
    if (op.b === "trail") return this.trail(ctx, op, st, A, P, w, i === 0);
    if (i === 0) return this.paint(ctx, op, st, { dot: P }, w);
    st.dist += Math.hypot(P.x - A.x, P.y - A.y);
    const from = i === 1 ? A : mid(this.pt(op, i - 2, mir), A);
    this.paint(ctx, op, st, { from, ctrl: A, to: mid(A, P) }, w);
  }

  private finish1(ctx: CanvasRenderingContext2D, op: LineOp, st: LineState, mir: boolean) {
    const n = op.p.length / 2;
    if (n < 2 || op.b === "sparkle" || op.b === "trail") return;
    const w = op.w * this.min;
    this.paint(ctx, op, st, { from: mid(this.pt(op, n - 2, mir), this.pt(op, n - 1, mir)), to: this.pt(op, n - 1, mir) }, w);
  }

  private paint(ctx: CanvasRenderingContext2D, op: LineOp, st: LineState, g: Shape, w: number) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = op.b === "eraser" ? "destination-out" : "source-over";
    if (op.b === "neon") {
      // A glowing tube: soft colored glow, then a bright core.
      ctx.shadowColor = op.c;
      ctx.shadowBlur = w * 0.9 * this.k;
      this.pass(ctx, g, w * 0.55, op.c);
      ctx.shadowBlur = 0;
      this.pass(ctx, g, w * 0.22, lighten(op.c, 0.7));
      return;
    }
    let c: string | CanvasPattern = op.c;
    if (op.b === "rainbow") c = hslHex((st.hue + st.dist * 0.45) % 360, 92, 56);
    else if (op.b === "crayon") {
      c = grain(ctx, op.c);
      ctx.globalAlpha = 0.95;
    } else if (op.b === "eraser") c = "#000";
    this.pass(ctx, g, w, c);
  }

  private pass(ctx: CanvasRenderingContext2D, g: Shape, w: number, c: string | CanvasPattern) {
    ctx.strokeStyle = c;
    ctx.fillStyle = c;
    ctx.lineWidth = w;
    ctx.beginPath();
    if ("dot" in g) {
      ctx.arc(g.dot.x, g.dot.y, w / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    ctx.moveTo(g.from.x, g.from.y);
    if (g.ctrl) ctx.quadraticCurveTo(g.ctrl.x, g.ctrl.y, g.to.x, g.to.y);
    else ctx.lineTo(g.to.x, g.to.y);
    ctx.stroke();
  }

  reset(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = "source-over";
  }

  private glitter(ctx: CanvasRenderingContext2D, op: LineOp, st: LineState, A: Pt, B: Pt, w: number, first: boolean) {
    this.reset(ctx);
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

  /** A line of little pictures along the finger's path. */
  private trail(ctx: CanvasRenderingContext2D, op: LineOp, st: LineState, A: Pt, B: Pt, size: number, first: boolean) {
    this.reset(ctx);
    const len = Math.hypot(B.x - A.x, B.y - A.y);
    const gap = size * 0.85;
    st.acc += len;
    if (first) st.acc = gap;
    while (st.acc >= gap) {
      st.acc -= gap;
      const f = len ? 1 - st.acc / len : 0;
      this.picture(ctx, op.k ?? "", A.x + (B.x - A.x) * f, A.y + (B.y - A.y) * f, size, (st.rnd() - 0.5) * 0.5, false);
    }
  }

  private picture(ctx: CanvasRenderingContext2D, key: string, x: number, y: number, s: number, rot: number, flip: boolean) {
    const img = this.stampFor(key);
    if (!img) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    if (flip) ctx.scale(-1, 1);
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

  stamp(ctx: CanvasRenderingContext2D, op: StampOp) {
    this.reset(ctx);
    const s = op.s * this.min;
    this.picture(ctx, op.k, op.x * this.W, op.y * this.H, s, op.rot, false);
    if (op.m) this.picture(ctx, op.k, (1 - op.x) * this.W, op.y * this.H, s, -op.rot, true);
  }

  op(ctx: CanvasRenderingContext2D, op: Op) {
    if (op.t === "stamp") return this.stamp(ctx, op);
    const sts = newStates(op);
    const n = op.p.length / 2;
    for (let i = 0; i < n; i++) this.seg(ctx, op, sts, i);
    this.finish(ctx, op, sts);
  }
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

interface BrushDef {
  id: Tool | "mirror" | "scene";
  label: string;
  say?: string;
  face: () => HTMLElement;
}

const BRUSHES: BrushDef[] = [
  { id: "crayon", label: "Crayon", say: SAY.crayon, face: () => svgIcon("", "d-crayon-ico") },
  { id: "marker", label: "Marker", say: SAY.marker, face: () => svgIcon(ICONS.marker) },
  { id: "rainbow", label: "Rainbow brush", say: SAY.rainbowBrush, face: () => svgIcon(ICONS.rainbowBrush) },
  { id: "neon", label: "Glow brush", say: SAY.neon, face: () => svgIcon(ICONS.neon, "d-neon-ico") },
  { id: "sparkle", label: "Sparkles", say: SAY.sparkle, face: () => svgIcon(ICONS.sparkle) },
  { id: "stamp", label: "Stamps", say: SAY.stamps, face: () => svgIcon(ICONS.stamp) },
  { id: "trail", label: "Stamp trail", say: SAY.trail, face: () => svgIcon(ICONS.trail) },
  { id: "eraser", label: "Eraser", say: SAY.eraser, face: () => svgIcon(ICONS.eraser) },
  { id: "mirror", label: "Mirror magic", say: SAY.mirror, face: () => svgIcon(ICONS.mirror) },
  { id: "scene", label: "Pictures to draw on", say: SAY.pickScene, face: () => svgIcon(ICONS.scene) },
];

/** Brush width (fraction of the short side) for [thin, fat]. */
const WIDTH: Record<Brush, [number, number]> = {
  crayon: [0.022, 0.05],
  marker: [0.032, 0.075],
  rainbow: [0.03, 0.07],
  neon: [0.035, 0.075],
  sparkle: [0.05, 0.1],
  trail: [0.08, 0.13],
  eraser: [0.05, 0.12],
};
const STAMP_SIZE: [number, number] = [0.16, 0.28];

/** Remembered while the app is open. */
let lastTool: Tool = "crayon";
let lastBrush: Brush = "crayon";
let lastStamp = "dumptruck";
let lastCat = "";
let mirrorOn = false;
let toldFree = false;
const told = new Set<string>();

const MAX_OPS = 40;

export function freeDraw(root: HTMLElement, o: FreeOpts) {
  const { signal } = o;
  let tool: Tool = lastTool;
  let stampKey = stampByKey(lastStamp) ? lastStamp : stampCats()[0].stamps[0].key;

  // ---- what we start from: the draft, or a saved picture to keep going on
  const draft = freeDraft();
  let entryId: string | undefined = draft?.entry;
  let changes = draft?.dirty ?? 0;
  let source: { img: string; w: number; h: number; flat: boolean } | null = draft ? { ...draft, flat: draft.flat !== false } : null;
  let bgId = draft?.bg && sceneById.has(draft.bg) ? draft.bg : "paper";
  if (o.entry) {
    if (draft && draft.dirty > 0 && draft.entry !== o.entry.id) {
      // Tuck the unsaved drawing into the gallery first so nothing is lost.
      const keep = draft;
      void flatten(keep).then((img) => img && putEntry({ id: keep.entry ?? newId(), t: Date.now(), kind: "free", img, w: keep.w, h: keep.h, bg: keep.bg }));
    }
    source = { ...o.entry, flat: true };
    entryId = o.entry.id;
    bgId = o.entry.bg && sceneById.has(o.entry.bg) ? o.entry.bg : "paper";
    changes = 0;
  }

  // ---- canvases: scene underneath, ink on top
  const bg = h("canvas", { class: "fd-bg", "aria-hidden": "true" });
  const cv = h("canvas", { class: "fd-canvas", "aria-label": "Drawing paper" });
  const ctx = cv.getContext("2d")!;
  const base = document.createElement("canvas");
  const bctx = base.getContext("2d")!;
  const mirrorLine = h("div", { class: "fd-mirror-line", "aria-hidden": "true" });
  const paper = h("div", { class: "fd-paper" }, bg, cv, mirrorLine);
  const cell = h("div", { class: "d-paper-cell fd-cell" }, paper);
  let k = 1;
  let ready = false;
  const loaded = new Map<string, CanvasImageSource | string | null>();
  const painter = new Painter((key) => loaded.get(key) ?? null);
  let ops: Op[] = [];
  const pending = new Set<Op>();
  const live = new Map<number, { op: LineOp; sts: LineState[] }>();
  const liveOps = new Set<Op>();

  function setup(cw: number, chh: number) {
    const aspect = source ? source.w / source.h : cw / chh;
    const W = Math.min(cw, chh * aspect);
    const H = W / aspect;
    painter.W = W;
    painter.H = H;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    k = Math.min(dpr, Math.sqrt(4_200_000 / (W * H)));
    painter.k = k;
    for (const c of [cv, base, bg]) {
      c.width = Math.round(W * k);
      c.height = Math.round(H * k);
    }
    place(cw, chh);
    void paintScene(bg, bgId);
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
  function place(cw: number, chh: number) {
    const aspect = painter.W / painter.H;
    const w = Math.min(cw, chh * aspect);
    paper.style.width = `${Math.floor(w)}px`;
    paper.style.height = `${Math.floor(w / aspect)}px`;
  }

  function redraw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    painter.reset(ctx);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(base, 0, 0);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    for (const op of ops) if (!pending.has(op)) painter.op(ctx, op);
    painter.reset(ctx);
  }

  /** Too many steps to undo: paint the oldest into the paper for good. */
  function bake() {
    while (ops.length > MAX_OPS && !liveOps.has(ops[0]) && !pending.has(ops[0])) {
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
  /** The whole picture (scene + ink) as a downscaled JPEG. */
  function snapshot(max: number, q: number): string | null {
    try {
      const s = Math.min(1, max / Math.max(cv.width, cv.height));
      const c = document.createElement("canvas");
      c.width = Math.round(cv.width * s);
      c.height = Math.round(cv.height * s);
      const g = c.getContext("2d")!;
      g.drawImage(bg, 0, 0, c.width, c.height);
      g.drawImage(cv, 0, 0, c.width, c.height);
      return c.toDataURL("image/jpeg", q);
    } catch {
      return null;
    }
  }
  /** Just the ink (PNG, see-through), so the scene can still be changed later. */
  function inkPng(max: number): string | null {
    try {
      const s = Math.min(1, max / Math.max(cv.width, cv.height));
      const c = document.createElement("canvas");
      c.width = Math.round(cv.width * s);
      c.height = Math.round(cv.height * s);
      c.getContext("2d")!.drawImage(cv, 0, 0, c.width, c.height);
      return c.toDataURL("image/png");
    } catch {
      return null;
    }
  }
  function saveDraft() {
    clearTimeout(saveTimer);
    saveTimer = 0;
    if (!ready || live.size) return;
    const meta = { w: painter.W, h: painter.H, entry: entryId, dirty: changes, bg: bgId };
    const ink = inkPng(1000);
    let ok = !!ink && ink.length < 1_800_000 && putFreeDraft({ ...meta, img: ink, flat: false });
    if (!ok) {
      // Too big for the device's storage: keep the whole picture as a JPEG instead.
      const img = snapshot(1200, 0.85);
      ok = !!img && putFreeDraft({ ...meta, img, flat: true });
    }
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
    const ok = putEntry({ id: entryId, t: Date.now(), kind: "free", img, w: painter.W, h: painter.H, bg: bgId });
    changes = 0;
    saveDraft();
    return ok;
  }

  // ---- drawing
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
      if (tool === "trail" && !loaded.get(stampKey)) {
        void ensureStamp(stampKey);
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
      if (b === "trail") op.k = stampKey;
      if (mirrorOn) op.m = true;
      const sts = newStates(op);
      ops.push(op);
      liveOps.add(op);
      live.set(e.pointerId, { op, sts });
      ctx.setTransform(k, 0, 0, k, 0, 0);
      painter.seg(ctx, op, sts, 0);
      painter.reset(ctx);
      if (b === "trail") sfx.pop();
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
        painter.seg(ctx, s.op, s.sts, s.op.p.length / 2 - 1);
      }
      painter.reset(ctx);
    },
    signal,
  );

  const end = (e: PointerEvent) => {
    const s = live.get(e.pointerId);
    if (!s) return;
    live.delete(e.pointerId);
    liveOps.delete(s.op);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    painter.finish(ctx, s.op, s.sts);
    changes++;
    bake();
    scheduleSave();
  };
  on(cv, "pointerup", end, signal);
  on(cv, "pointercancel", end, signal);
  on(cv, "contextmenu", (e: Event) => e.preventDefault(), signal);

  function stampAt(x: number, y: number) {
    const def = stampByKey(stampKey);
    if (!def || !loaded.get(stampKey)) {
      void ensureStamp(stampKey);
      return;
    }
    const op: StampOp = { t: "stamp", k: stampKey, x, y, s: STAMP_SIZE[pal.size()], rot: (Math.random() - 0.5) * 0.35 };
    if (mirrorOn) op.m = true;
    ops.push(op);
    pending.add(op);
    sfx.pop();
    // A quick pop-in on top, then it's printed onto the paper.
    const r = cv.getBoundingClientRect();
    const px = op.s * Math.min(r.width, r.height);
    const pops = [x, ...(op.m ? [1 - x] : [])].map((fx, i) =>
      h("div", { class: `fd-stamp-pop ${i ? "flip" : ""}`, style: `left:${fx * r.width}px;top:${y * r.height}px;width:${px}px;height:${px}px;--rot:${i ? -op.rot : op.rot}rad` }, def.face()),
    );
    paper.append(...pops);
    setTimeout(() => {
      pops.forEach((p) => p.remove());
      if (!pending.delete(op) || !ops.includes(op)) return;
      ctx.setTransform(k, 0, 0, k, 0, 0);
      painter.stamp(ctx, op);
    }, 260);
    changes++;
    bake();
    scheduleSave();
  }

  async function ensureStamp(key: string) {
    const def = stampByKey(key);
    if (!def || loaded.get(key)) return;
    const img = await stampImage(def);
    loaded.set(key, img);
  }

  // ---- controls
  const pal = palette({
    signal,
    sizes: true,
    onPick: () => {
      if (tool === "eraser" || tool === "stamp" || tool === "trail") setTool(lastBrush, false);
      updateFaces();
    },
  });

  const brushBtns = new Map<string, HTMLButtonElement>();
  const brushes = h("div", { class: "d-brushes" });
  for (const b of BRUSHES) {
    const btn = dBtn(b.face(), b.label, () => {
      bounce(btn);
      if (b.id === "mirror") toggleMirror();
      else if (b.id === "scene") pickScene();
      else setTool(b.id, true);
    }, `d-brush d-brush-${b.id}`);
    brushBtns.set(b.id, btn);
    brushes.append(btn);
  }

  // Stamp tray: a tab per kind of picture, and a scrolling grid of stamps.
  const cats = stampCats();
  let cat = cats.find((c) => c.id === lastCat) ?? cats.find((c) => c.stamps.some((s) => s.key === stampKey)) ?? cats[0];
  const trayGrid = h("div", { class: "d-tray-grid" });
  const trayTabs = h("div", { class: "d-tray-tabs" });
  const tray = h("div", { class: "d-tray hidden" }, trayTabs, trayGrid);
  const catBtns = cats.map((c) => {
    const b = h("button", { class: "d-tray-tab", "aria-label": c.label }, fluent(c.glyph));
    b.addEventListener("click", () => {
      sfx.tap();
      bounce(b);
      showCat(c);
    });
    trayTabs.append(b);
    return b;
  });
  function showCat(c: (typeof cats)[number]) {
    cat = c;
    lastCat = c.id;
    catBtns.forEach((b, i) => b.classList.toggle("sel", cats[i] === c));
    trayGrid.replaceChildren(
      ...c.stamps.map((s) => {
        const b = h("button", { class: `d-stamp ${s.key === stampKey ? "sel" : ""}`, "aria-label": s.say.replace("!", "") }, s.face());
        b.addEventListener("click", () => {
          sfx.tap();
          bounce(b);
          stampKey = lastStamp = s.key;
          void ensureStamp(s.key);
          trayGrid.querySelectorAll(".d-stamp").forEach((x) => x.classList.toggle("sel", x === b));
          updateFaces();
          void speak(s.say);
        });
        return b;
      }),
    );
    trayGrid.scrollTop = 0;
    c.stamps.forEach((s) => void ensureStamp(s.key));
  }
  showCat(cat);

  function setTool(t: Tool, say: boolean) {
    tool = lastTool = t;
    if (t !== "stamp" && t !== "trail") lastBrush = t;
    brushBtns.forEach((b, id) => b.classList.toggle("sel", id === t));
    const pictures = t === "stamp" || t === "trail";
    tray.classList.toggle("hidden", !pictures);
    pal.el.classList.toggle("d-swapped", pictures);
    cv.classList.toggle("stamping", t === "stamp");
    if (pictures) void ensureStamp(stampKey);
    if (!say) return;
    const def = BRUSHES.find((b) => b.id === t)!;
    if (!told.has(t) || !(t === "stamp" || t === "trail")) {
      told.add(t);
      void speak(def.say!);
    } else void speak(stampByKey(stampKey)?.say ?? "");
  }

  function toggleMirror() {
    mirrorOn = !mirrorOn;
    applyMirror();
    if (mirrorOn) {
      sfx.sticker();
      void speak(SAY.mirror);
    }
  }
  function applyMirror() {
    brushBtns.get("mirror")?.classList.toggle("on", mirrorOn);
    paper.classList.toggle("mirroring", mirrorOn);
  }

  function pickScene() {
    const close = () => {
      overlay.classList.add("leaving");
      setTimeout(() => overlay.remove(), 250);
    };
    const grid = h(
      "div",
      { class: "fd-scenes" },
      ...SCENES.map((sc) => {
        const b = h("button", { class: `fd-scene ${sc.id === bgId ? "sel" : ""}`, "aria-label": sc.say.replace("!", ""), html: sc.svg });
        b.addEventListener("click", () => {
          sfx.pop();
          close();
          if (sc.id !== bgId) {
            bgId = sc.id;
            void paintScene(bg, bgId);
            changes++;
            scheduleSave();
            bounce(paper);
          }
          void speak(sc.say);
        });
        return b;
      }),
    );
    const overlay = h("div", { class: "overlay d-overlay fd-scene-pick", role: "dialog", "aria-label": "Pictures to draw on" }, h("div", { class: "d-confirm fd-scene-card" }, grid, dBtn(svgIcon(ICONS.no), "Close", close)));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
    signal.addEventListener("abort", () => overlay.remove());
    document.body.append(overlay);
    void speak(SAY.pickScene);
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
        bctx.clearRect(0, 0, base.width, base.height);
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

  root.replaceChildren(h("div", { class: "d-studio fd-studio" }, tools, cell, h("div", { class: "d-side" }, brushes, h("div", { class: "d-swap" }, pal.el, tray))));
  setTool(tool, false);
  applyMirror();
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

/** Flatten a draft (ink + its scene) into one JPEG for the gallery. */
async function flatten(d: { img: string; w: number; h: number; flat?: boolean; bg?: string }): Promise<string | null> {
  if (d.flat !== false) return d.img;
  try {
    const img = await loadImage(d.img);
    if (!img) return null;
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    await paintScene(c, d.bg ?? "paper");
    c.getContext("2d")!.drawImage(img, 0, 0);
    return c.toDataURL("image/jpeg", 0.82);
  } catch {
    return null;
  }
}

export function freeLines(): string[] {
  return [...stampLines(), ...sceneLines()];
}
