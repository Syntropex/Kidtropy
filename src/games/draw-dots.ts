/**
 * Dot-to-dot: join the numbered dots in order (drag from dot to dot, or tap
 * them one by one). Each dot says its number. When the last one is joined the
 * picture appears in full color, and then it can be colored in.
 */
import { sfx } from "../lib/sfx";
import { speak } from "../lib/speech";
import { bounce, h, reward, wiggle } from "../lib/ui";
import { NUMBERS } from "../voice/lines";
import { fitSquares } from "./draw-color";
import { DOT_PICS, type DotPic } from "./draw-dots-data";
import { dBtn, fluent, ICONS, on, svgIcon } from "./draw-shared";

const NS = "http://www.w3.org/2000/svg";
const MORE = ["eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** "Seven!" — the same wording as the rest of the app (src/voice/lines.ts). */
export const numberSay = (n: number) => `${cap(n <= 10 ? NUMBERS[n] : MORE[n - 11])}!`;

export const DOT_SAY = {
  pick: "Pick a dot picture!",
  start: "Start at number one!",
  done: "You did it!",
};
export const itsA = (p: DotPic) => `It's a ${p.name}!`;

const doneThisVisit = new Set<string>();
let saidPick = false;

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, parent?: Element): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  parent?.append(e);
  return e;
}

/** Where a dot's number goes: just outside the shape. */
function labelPos(p: DotPic, i: number): [number, number] {
  const cx = p.dots.reduce((s, d) => s + d[0], 0) / p.dots.length;
  const cy = p.dots.reduce((s, d) => s + d[1], 0) / p.dots.length;
  const [x, y] = p.dots[i];
  const dx = x - cx;
  const dy = y - cy;
  const len = Math.hypot(dx, dy) || 1;
  const lx = Math.max(9, Math.min(191, x + (dx / len) * 14));
  const ly = Math.max(10, Math.min(195, y + (dy / len) * 14 + 4));
  return [lx, ly];
}

function dotsSvg(p: DotPic, small = false): SVGSVGElement {
  const s = el("svg", { viewBox: "0 0 200 200", class: "dd-svg" });
  const g = el("g", { class: "dd-dots" }, s);
  p.dots.forEach(([x, y], i) => {
    el("circle", { cx: x, cy: y, r: small ? 6 : 6.5, class: "dd-dot" }, g);
    if (!small) {
      const [lx, ly] = labelPos(p, i);
      const t = el("text", { x: lx, y: ly, class: "dd-num", "text-anchor": "middle" }, g);
      t.textContent = String(i + 1);
    }
  });
  return s;
}

/** The studio-home card: a star, half joined. */
export function dotsFace(): SVGSVGElement {
  const p = DOT_PICS[0];
  const s = dotsSvg(p);
  const pts = p.dots.slice(0, 6).map(([x, y]) => `${x},${y}`).join(" ");
  s.insertBefore(el("polyline", { class: "dd-line", points: pts }), s.firstChild);
  s.querySelectorAll(".dd-dot, .dd-num").forEach((d, i) => i < 12 && d.classList.add("on"));
  return s;
}

export function dotsPicker(root: HTMLElement, signal: AbortSignal, back: () => void, open: (p: DotPic) => void) {
  const grid = h("div", { class: "d-fitgrid dd-pick" });
  DOT_PICS.forEach((p, i) => {
    const b = h(
      "button",
      { class: "cp-thumb dd-thumb pop-in", style: `animation-delay:${i * 30}ms`, "aria-label": `Dot to dot, ${p.dots.length} dots` },
      doneThisVisit.has(p.id) ? h("span", { class: "pic art", html: p.art }) : dotsSvg(p, true),
      h("span", { class: "dd-count" }, String(p.dots.length)),
    );
    b.addEventListener("click", () => {
      sfx.pop();
      bounce(b);
      setTimeout(() => open(p), 160);
    });
    grid.append(b);
  });
  root.replaceChildren(h("div", { class: "d-screen" }, h("div", { class: "d-bar" }, dBtn(fluent("⬅"), "Back", back)), grid));
  fitSquares(grid, DOT_PICS.length, signal, 14, 240);
  if (!saidPick) {
    saidPick = true;
    void speak(DOT_SAY.pick);
  }
}

export interface DotOpts {
  pic: DotPic;
  signal: AbortSignal;
  alive: () => boolean;
  back: () => void;
  /** Color the finished picture. */
  color: () => void;
  /** Another dot picture. */
  next: () => void;
}

export function dotGame(root: HTMLElement, o: DotOpts) {
  const { pic, signal } = o;
  const svg = dotsSvg(pic);
  const art = el("g", { class: "dd-art" });
  art.innerHTML = new DOMParser().parseFromString(pic.art, "image/svg+xml").documentElement.innerHTML;
  // The art takes its outline style from the root <svg> of the drawing.
  for (const [k, v] of Object.entries({ fill: "none", stroke: "#2b2b3a", "stroke-width": 6, "stroke-linejoin": "round", "stroke-linecap": "round" })) art.setAttribute(k, String(v));
  svg.prepend(art);
  const line = el("polyline", { class: "dd-line", points: "" });
  const rubber = el("line", { class: "dd-rubber", x1: 0, y1: 0, x2: 0, y2: 0 });
  svg.insertBefore(rubber, svg.querySelector(".dd-dots"));
  svg.insertBefore(line, rubber);
  const ring = el("circle", { class: "dd-ring", r: 12, cx: pic.dots[0][0], cy: pic.dots[0][1] });
  svg.insertBefore(ring, svg.querySelector(".dd-dots"));
  const dotEls = [...svg.querySelectorAll<SVGCircleElement>(".dd-dot")];
  const numEls = [...svg.querySelectorAll<SVGTextElement>(".dd-num")];

  const paper = h("div", { class: "cp-paper dd-paper" }, svg);
  const cell = h("div", { class: "d-paper-cell" }, paper);
  const after = h("div", { class: "dd-after hidden" });
  const tools = h("div", { class: "d-tools" }, dBtn(fluent("⬅"), "Back", o.back));
  root.replaceChildren(h("div", { class: "d-studio dd-studio" }, tools, cell, h("div", { class: "d-side dd-side" }, after)));

  let next = 0;
  let dragging = -1;
  let finished = false;
  const pts: string[] = [];

  const toSvg = (e: PointerEvent): [number, number] => {
    const r = svg.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * 200, ((e.clientY - r.top) / r.height) * 200];
  };
  const near = (x: number, y: number, max: number) => {
    let best = -1;
    let bd = max;
    pic.dots.forEach(([dx, dy], i) => {
      const d = Math.hypot(dx - x, dy - y);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return best;
  };

  function moveRing() {
    if (next >= pic.dots.length) {
      ring.style.display = "none";
      return;
    }
    ring.setAttribute("cx", String(pic.dots[next][0]));
    ring.setAttribute("cy", String(pic.dots[next][1]));
    ring.classList.remove("dd-ring-go");
    void ring.getBoundingClientRect();
    ring.classList.add("dd-ring-go");
  }

  function connect(i: number) {
    const [x, y] = pic.dots[i];
    pts.push(`${x},${y}`);
    line.setAttribute("points", pts.join(" "));
    dotEls[i].classList.add("on");
    numEls[i]?.classList.add("on");
    next = i + 1;
    sfx.pop();
    void speak(numberSay(i + 1));
    moveRing();
    if (next === pic.dots.length) void complete();
  }

  async function complete() {
    finished = true;
    dragging = -1;
    rubber.style.display = "none";
    await new Promise((r) => setTimeout(r, 450));
    if (!o.alive()) return;
    pts.push(pts[0]);
    line.setAttribute("points", pts.join(" "));
    sfx.whoosh();
    await new Promise((r) => setTimeout(r, 350));
    if (!o.alive()) return;
    svg.classList.add("dd-reveal");
    doneThisVisit.add(pic.id);
    void reward(paper);
    void speak(`${DOT_SAY.done} ${itsA(pic)}`);
    after.replaceChildren(
      dBtn(svgIcon(ICONS.crayons), "Color it", o.color, "dd-go d-go"),
      dBtn(fluent("➡️"), "Another one", o.next, "dd-next"),
    );
    after.classList.remove("hidden");
  }

  function hint() {
    wiggle(dotEls[next] ?? svg);
    moveRing();
    void speak(next === 0 ? DOT_SAY.start : numberSay(next + 1));
  }

  on(
    svg,
    "pointerdown",
    (e: PointerEvent) => {
      if (finished || dragging >= 0) return;
      e.preventDefault();
      const [x, y] = toSvg(e);
      const d = near(x, y, 20);
      if (d === next) {
        connect(d);
      } else if (next === 0 || (d >= 0 && d !== next - 1)) {
        hint();
        return;
      }
      if (finished) return;
      dragging = e.pointerId;
      try {
        svg.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      updateRubber(x, y);
    },
    signal,
  );

  function updateRubber(x: number, y: number) {
    if (next === 0 || finished) return;
    const [lx, ly] = pic.dots[next - 1];
    rubber.setAttribute("x1", String(lx));
    rubber.setAttribute("y1", String(ly));
    rubber.setAttribute("x2", String(x));
    rubber.setAttribute("y2", String(y));
    rubber.style.display = "";
  }

  on(
    svg,
    "pointermove",
    (e: PointerEvent) => {
      if (e.pointerId !== dragging || finished) return;
      e.preventDefault();
      const evs = e.getCoalescedEvents?.().length ? e.getCoalescedEvents() : [e];
      for (const ev of evs) {
        const [x, y] = toSvg(ev);
        if (next < pic.dots.length && Math.hypot(pic.dots[next][0] - x, pic.dots[next][1] - y) < 15) connect(next);
        if (finished) return;
        updateRubber(x, y);
      }
    },
    signal,
  );

  const up = (e: PointerEvent) => {
    if (e.pointerId !== dragging) return;
    dragging = -1;
    rubber.style.display = "none";
  };
  on(svg, "pointerup", up, signal);
  on(svg, "pointercancel", up, signal);

  rubber.style.display = "none";
  moveRing();
  void speak(DOT_SAY.start);
}

export function dotLines(): string[] {
  const max = Math.max(...DOT_PICS.map((p) => p.dots.length));
  return [...Object.values(DOT_SAY), ...DOT_PICS.map(itsA), ...Array.from({ length: max }, (_, i) => numberSay(i + 1))];
}
