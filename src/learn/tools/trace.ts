/**
 * Trace it: pick a letter or number, then trace over a big faint glyph with a
 * fat crayon. When most of the glyph is covered (and the child didn't just
 * scribble over the whole page) we celebrate. There's a free-draw page too.
 */
import { sfx } from "../../lib/sfx";
import { speak } from "../../lib/speech";
import { bounce, h, icon, pickOne, reward } from "../../lib/ui";
import type { Tool } from "../types";
import { cap, DIGITS, fitGrid, LOWER, on, sayNumber, toolBtn, UPPER } from "./common";

type Kind = "upper" | "lower" | "digit";

const SETS: Record<Kind, string[]> = { upper: UPPER, lower: LOWER, digit: DIGITS };

const TABS: { kind: Kind | "draw"; label: string; glyph?: string; aria: string }[] = [
  { kind: "upper", label: "ABC", aria: "Big letters" },
  { kind: "lower", label: "abc", aria: "Little letters" },
  { kind: "digit", label: "123", aria: "Numbers" },
  { kind: "draw", label: "", glyph: "🎨", aria: "Draw anything" },
];

const COLORS = [
  { name: "red", c: "#f4433b" },
  { name: "orange", c: "#ff9100" },
  { name: "green", c: "#36b14a" },
  { name: "blue", c: "#2f7bff" },
  { name: "purple", c: "#a23bdc" },
];

/** Kid-friendly letter shapes first (Futura has a single-story "a"). */
const FONT = `Futura, "Century Gothic", "Avenir Next", ui-rounded, "Arial Rounded MT Bold", "Nunito", Arial, sans-serif`;

const SAY = {
  intro: "Pick a letter or a number. Then trace it with your finger!",
  traceIt: "Trace it with your finger!",
  draw: "Draw anything you like!",
  stay: "Try to stay on the lines!",
};
const PRAISE = ["Great tracing!", "You did it!", "Beautiful!"];

/** What we call a glyph: "B!" for B and b, "Seven!" for 7. */
const nameOf = (ch: string) => (/\d/.test(ch) ? sayNumber(Number(ch)) : `${ch.toUpperCase()}!`);
const kindOf = (ch: string): Kind => (/\d/.test(ch) ? "digit" : ch === ch.toUpperCase() ? "upper" : "lower");

/** How much of the glyph must be covered, and how much ink may land off it. */
const NEED_COVER = 0.6;
const MAX_OUTSIDE = 0.4;

interface Stroke {
  color: string;
  /** Width as a fraction of the paper width. */
  width: number;
  /** Points as fractions of the paper size. */
  pts: { x: number; y: number }[];
}

interface Layout {
  size: number;
  x: number;
  baseline: number;
  capTop: number;
  xTop: number;
  descBottom: number;
  stem: number;
}

const measureCtx = document.createElement("canvas").getContext("2d")!;

function layoutGlyph(ch: string, w: number, hgt: number): Layout {
  const ctx = measureCtx;
  ctx.font = `bold 100px ${FONT}`;
  const capA = ctx.measureText("H").actualBoundingBoxAscent / 100;
  const xA = ctx.measureText("x").actualBoundingBoxAscent / 100;
  const desc = Math.max(0.15, ctx.measureText("gjpqy").actualBoundingBoxDescent / 100);
  const l = ctx.measureText("l");
  const stem = Math.min(0.2, Math.max(0.08, (l.actualBoundingBoxLeft + l.actualBoundingBoxRight) / 100));
  const m = ctx.measureText(ch);
  const left = m.actualBoundingBoxLeft / 100;
  const right = m.actualBoundingBoxRight / 100;
  const lower = kindOf(ch) === "lower";
  // Leave room for the descender line on little letters.
  const band = lower ? capA + desc : capA;
  const size = Math.min((hgt * 0.8) / band, (w * 0.8) / Math.max(0.45, left + right));
  const top = (hgt - band * size) / 2;
  const baseline = top + capA * size;
  return {
    size,
    x: w / 2 - ((right - left) / 2) * size,
    baseline,
    capTop: baseline - capA * size,
    xTop: baseline - xA * size,
    descBottom: baseline + desc * size,
    stem: stem * size,
  };
}

export const trace: Tool = {
  id: "trace",
  grades: ["prek", "k", "g1"],
  title: "Trace It",
  icon: "✏️",
  lines() {
    const out = [...Object.values(SAY), ...PRAISE, ...COLORS.map((c) => `${cap(c.name)}!`)];
    for (const ch of [...UPPER, ...DIGITS]) {
      out.push(nameOf(ch), `${nameOf(ch)} ${SAY.traceIt}`);
      for (const p of PRAISE) out.push(`${nameOf(ch)} ${p}`);
    }
    return out;
  },
  start(scene) {
    const { root, signal } = scene;
    const wrap = h("div", { class: "t-wrap t-trace" });
    root.replaceChildren(wrap);

    let kind: Kind = "upper";
    let color = COLORS[0].c;
    let toldHow = false;

    // ---- Picker -------------------------------------------------------------

    function picker() {
      const tabs = h(
        "div",
        { class: "t-tabs", role: "tablist" },
        ...TABS.map((t) =>
          h(
            "button",
            {
              class: `t-tab${t.kind === kind ? " on" : ""}`,
              role: "tab",
              "aria-selected": String(t.kind === kind),
              "aria-label": t.aria,
              onclick: () => {
                sfx.tap();
                if (t.kind === "draw") return board(null);
                kind = t.kind;
                picker();
              },
            },
            t.glyph ? icon(t.glyph) : t.label,
          ),
        ),
      );
      const chars = SETS[kind];
      const grid = h(
        "div",
        { class: "t-pick-grid" },
        ...chars.map((ch, i) =>
          h(
            "button",
            {
              class: "t-pick pop-in",
              style: `animation-delay:${i * 12}ms`,
              "aria-label": ch,
              onclick: (e: MouseEvent) => {
                bounce(e.currentTarget as Element);
                sfx.pop();
                board(ch);
              },
            },
            h("span", { class: `t-pick-ch ${kind}` }, ch),
          ),
        ),
      );
      const gridBox = h("div", { class: "t-pick-box" }, grid);
      wrap.replaceChildren(tabs, gridBox);
      fitGrid(grid, () => chars.length, signal, 12, 150);
    }

    // ---- Tracing board --------------------------------------------------------

    let boardCtl: AbortController | null = null;

    function board(ch: string | null) {
      boardCtl?.abort();
      const ctl = new AbortController();
      boardCtl = ctl;
      const sig = ctl.signal;
      const live = () => scene.alive() && !ctl.signal.aborted;

      const bg = h("canvas", { class: "t-bg", "aria-hidden": "true" });
      const ink = h("canvas", { class: "t-ink", "aria-label": ch ? `Trace ${ch} with your finger` : "Draw with your finger" });
      const paper = h("div", { class: "t-paper" }, bg, ink);
      const boardBox = h("div", { class: "t-board" }, paper);

      const set = ch ? SETS[kindOf(ch)] : null;
      const step = (d: number) => {
        if (!ch || !set) return;
        sfx.tap();
        board(set[(set.indexOf(ch) + d + set.length) % set.length]);
      };
      const nextBtn = ch ? toolBtn("➡️", "Next", () => step(1)) : null;
      const colorDots = COLORS.map((c) =>
        h("button", {
          class: `t-color${c.c === color ? " on" : ""}`,
          style: `--c:${c.c}`,
          "aria-label": c.name,
          onclick: (e: MouseEvent) => {
            color = c.c;
            colorDots.forEach((d) => d.classList.toggle("on", d === e.currentTarget));
            bounce(e.currentTarget as Element);
            sfx.tap();
            void speak(`${cap(c.name)}!`);
          },
        }),
      );
      const bar = h(
        "div",
        { class: "t-bar" },
        h(
          "div",
          { class: "t-bar-row" },
          toolBtn(ch && kindOf(ch) === "digit" ? "🔢" : "🔤", "Pick another", () => {
            sfx.tap();
            ctl.abort();
            picker();
          }),
          ch ? toolBtn("⬅️", "Back", () => step(-1)) : null,
          nextBtn,
          toolBtn("🧽", "Wipe it clean", () => {
            sfx.whoosh();
            strokes = [];
            done = false;
            warned = false;
            nextBtn?.classList.remove("t-pulse");
            redraw();
          }),
        ),
        h("div", { class: "t-bar-row t-colors" }, ...colorDots),
      );
      wrap.replaceChildren(h("div", { class: `t-trace-view${ch ? "" : " free"}` }, boardBox, bar));

      const bctx = bg.getContext("2d")!;
      const ictx = ink.getContext("2d")!;
      // Low-resolution copies for measuring coverage.
      const mask = document.createElement("canvas");
      const near = document.createElement("canvas");
      const reach = document.createElement("canvas");
      const mctx = mask.getContext("2d", { willReadFrequently: true })!;
      const nctx = near.getContext("2d", { willReadFrequently: true })!;
      const rctx = reach.getContext("2d", { willReadFrequently: true })!;

      let w = 0;
      let hgt = 0;
      let k = 1; // low-res scale
      let lay: Layout | null = null;
      let strokes: Stroke[] = [];
      let done = false;
      let warned = false;
      let glyphPixels = 0;

      const crayon = () => (lay ? Math.max(18, lay.stem * 0.8) : Math.max(16, Math.min(w, hgt) * 0.045));

      function drawGlyph(ctx: CanvasRenderingContext2D, L: Layout, scale: number) {
        ctx.font = `bold ${L.size * scale}px ${FONT}`;
        ctx.textBaseline = "alphabetic";
        ctx.textAlign = "left";
        ctx.fillText(ch!, L.x * scale, L.baseline * scale);
      }

      function paintBackground() {
        const dpr = Math.min(3, window.devicePixelRatio || 1);
        for (const c of [bg, ink]) {
          c.width = Math.round(w * dpr);
          c.height = Math.round(hgt * dpr);
        }
        bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ictx.setTransform(dpr, 0, 0, dpr, 0, 0);
        bctx.clearRect(0, 0, w, hgt);
        if (!ch || !lay) return;
        const L = lay;
        // Handwriting lines: top, dashed middle, baseline.
        const x0 = w * 0.04;
        const x1 = w * 0.96;
        const hline = (y: number, c: string, dash: number[], lw: number) => {
          bctx.beginPath();
          bctx.setLineDash(dash);
          bctx.strokeStyle = c;
          bctx.lineWidth = lw;
          bctx.moveTo(x0, y);
          bctx.lineTo(x1, y);
          bctx.stroke();
        };
        hline(L.capTop, "#bbdefb", [], 3);
        hline(L.xTop, "#e3f2fd", [12, 10], 3);
        hline(L.baseline, "#90caf9", [], 4);
        if (kindOf(ch) === "lower") hline(L.descBottom, "#e3f2fd", [], 3);
        bctx.setLineDash([]);
        // The glyph: faint fill with a dashed outline (gold once it's traced).
        bctx.fillStyle = done ? "#fff59d" : "#eef1f5";
        drawGlyph(bctx, L, 1);
        bctx.lineJoin = "round";
        bctx.lineWidth = Math.max(3, L.size * 0.012);
        bctx.setLineDash(done ? [] : [Math.max(8, L.size * 0.035), Math.max(7, L.size * 0.03)]);
        bctx.strokeStyle = done ? "#ffb300" : "#9aa7b4";
        bctx.strokeText(ch, L.x, L.baseline);
        bctx.setLineDash([]);
      }

      function buildMasks() {
        if (!ch || !lay) return;
        k = Math.min(1, 140 / Math.max(w, hgt));
        const mw = Math.max(1, Math.round(w * k));
        const mh = Math.max(1, Math.round(hgt * k));
        for (const c of [mask, near, reach]) {
          c.width = mw;
          c.height = mh;
        }
        mctx.fillStyle = "#000";
        drawGlyph(mctx, lay, k);
        // "Near the glyph": the glyph grown by about half a stem on each side.
        nctx.fillStyle = "#000";
        nctx.strokeStyle = "#000";
        nctx.lineJoin = "round";
        nctx.lineWidth = lay.stem * 1.1 * k;
        drawGlyph(nctx, lay, k);
        nctx.font = `bold ${lay.size * k}px ${FONT}`;
        nctx.strokeText(ch, lay.x * k, lay.baseline * k);
        const d = mctx.getImageData(0, 0, mw, mh).data;
        glyphPixels = 0;
        for (let i = 3; i < d.length; i += 4) if (d[i] > 128) glyphPixels++;
      }

      function segment(ctx: CanvasRenderingContext2D, s: Stroke, i: number, scale: number) {
        const P = (j: number) => ({ x: s.pts[j].x * w * scale, y: s.pts[j].y * hgt * scale });
        ctx.strokeStyle = s.color;
        ctx.fillStyle = s.color;
        ctx.lineWidth = s.width * w * scale;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        if (i === 0) {
          const p = P(0);
          ctx.beginPath();
          ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2);
          ctx.fill();
          return;
        }
        const a = P(i - 1);
        const b = P(i);
        const prev = i >= 2 ? P(i - 2) : a;
        const m1 = { x: (prev.x + a.x) / 2, y: (prev.y + a.y) / 2 };
        const m2 = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        ctx.beginPath();
        ctx.moveTo(i >= 2 ? m1.x : a.x, i >= 2 ? m1.y : a.y);
        ctx.quadraticCurveTo(a.x, a.y, m2.x, m2.y);
        ctx.stroke();
      }

      function reachSegment(s: Stroke, i: number) {
        if (!ch || !lay) return;
        const a = s.pts[Math.max(0, i - 1)];
        const b = s.pts[i];
        rctx.strokeStyle = "#000";
        rctx.lineCap = "round";
        rctx.lineWidth = s.width * w * k * 1.35;
        rctx.beginPath();
        rctx.moveTo(a.x * w * k, a.y * hgt * k);
        rctx.lineTo(b.x * w * k + 0.01, b.y * hgt * k);
        rctx.stroke();
      }

      function redraw() {
        paintBackground();
        if (ch && lay) {
          rctx.clearRect(0, 0, reach.width, reach.height);
        }
        for (const s of strokes) {
          for (let i = 0; i < s.pts.length; i++) {
            segment(ictx, s, i, 1);
            reachSegment(s, i);
          }
        }
      }

      function resize() {
        const r = paper.getBoundingClientRect();
        if (r.width < 10 || r.height < 10) return;
        if (Math.abs(r.width - w) < 1 && Math.abs(r.height - hgt) < 1) return;
        w = r.width;
        hgt = r.height;
        lay = ch ? layoutGlyph(ch, w, hgt) : null;
        buildMasks();
        redraw();
      }
      const ro = new ResizeObserver(resize);
      ro.observe(paper);
      sig.addEventListener("abort", () => ro.disconnect());
      resize();

      function check() {
        if (!ch || !lay || done || !glyphPixels) return;
        const m = mctx.getImageData(0, 0, mask.width, mask.height).data;
        const n = nctx.getImageData(0, 0, near.width, near.height).data;
        const r = rctx.getImageData(0, 0, reach.width, reach.height).data;
        let covered = 0;
        let inkAll = 0;
        let inkOff = 0;
        for (let i = 3; i < m.length; i += 4) {
          const inked = r[i] > 128;
          if (m[i] > 128 && inked) covered++;
          if (inked) {
            inkAll++;
            if (n[i] <= 128) inkOff++;
          }
        }
        const cover = covered / glyphPixels;
        const off = inkAll ? inkOff / inkAll : 0;
        if (cover >= NEED_COVER && off <= MAX_OUTSIDE) {
          done = true;
          paintBackground();
          for (const s of strokes) for (let i = 0; i < s.pts.length; i++) segment(ictx, s, i, 1);
          bounce(paper);
          nextBtn?.classList.add("t-pulse");
          void reward(paper);
          void speak(`${nameOf(ch)} ${pickOne(PRAISE)}`);
        } else if (cover >= NEED_COVER && !warned) {
          warned = true;
          void speak(SAY.stay);
        }
      }

      // Drawing: one stroke per finger.
      const active = new Map<number, Stroke>();
      const pos = (e: PointerEvent) => {
        const r = ink.getBoundingClientRect();
        return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
      };
      on(
        ink,
        "pointerdown",
        (e: PointerEvent) => {
          if (!live() || !w) return;
          e.preventDefault();
          try {
            ink.setPointerCapture(e.pointerId);
          } catch {
            /* ignore */
          }
          const s: Stroke = { color, width: crayon() / w, pts: [pos(e)] };
          strokes.push(s);
          active.set(e.pointerId, s);
          segment(ictx, s, 0, 1);
          reachSegment(s, 0);
        },
        sig,
      );
      on(
        ink,
        "pointermove",
        (e: PointerEvent) => {
          const s = active.get(e.pointerId);
          if (!s) return;
          e.preventDefault();
          const evs = (e.getCoalescedEvents?.() ?? []).length ? e.getCoalescedEvents() : [e];
          for (const ev of evs) {
            const p = pos(ev);
            const last = s.pts[s.pts.length - 1];
            if (Math.hypot((p.x - last.x) * w, (p.y - last.y) * hgt) < 2) continue;
            s.pts.push(p);
            segment(ictx, s, s.pts.length - 1, 1);
            reachSegment(s, s.pts.length - 1);
          }
        },
        sig,
      );
      const end = (e: PointerEvent) => {
        if (!active.delete(e.pointerId)) return;
        if (active.size === 0) check();
      };
      on(ink, "pointerup", end, sig);
      on(ink, "pointercancel", end, sig);

      if (ch) {
        const first = !toldHow;
        toldHow = true;
        void speak(first ? `${nameOf(ch)} ${SAY.traceIt}` : nameOf(ch));
      } else {
        void speak(SAY.draw);
      }
    }

    picker();
    void speak(SAY.intro);
    return () => boardCtl?.abort();
  },
};
