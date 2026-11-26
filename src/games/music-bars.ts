/**
 * The eight rainbow bars shared by the xylophone, the animal piano and songs.
 * Multi-touch: every finger plays, and sliding a finger across the bars plays
 * each bar it crosses (a glissando!).
 */
import { h, icon } from "../lib/ui";
import { BAR_COLORS, noteArt } from "./music-art";

export interface Bars {
  el: HTMLElement;
  bars: HTMLElement[];
  /** Bounce a bar and float a note up from it (or from x/y on screen). */
  hit(i: number, at?: { x: number; y: number }): void;
  /** Make one bar glow ("tap me next"), or none. */
  glow(i: number | null): void;
  /** A little hop to say "over here!". */
  nudge(i: number): void;
}

export function makeBars(signal: AbortSignal, onPress: (i: number, at: { x: number; y: number }) => void, decorate?: (bar: HTMLElement, i: number) => void): Bars {
  const bars = BAR_COLORS.map((c, i) => {
    const b = h("div", { class: "mx-key", style: `--c:${c}; --i:${i}`, "data-i": String(i), role: "button", "aria-label": `Bar ${i + 1}` });
    b.append(h("span", { class: "mx-star", "aria-hidden": "true" }, icon("⭐")));
    decorate?.(b, i);
    return b;
  });
  const fx = h("div", { class: "mx-fx", "aria-hidden": "true" });
  const row = h("div", { class: "mx-keys" }, ...bars);
  const el = h("div", { class: "mx-keys-wrap" }, row, fx);

  const fingers = new Map<number, number>();

  const barAt = (x: number, y: number): number => {
    const t = document.elementFromPoint(x, y)?.closest<HTMLElement>(".mx-key");
    if (!t || !row.contains(t)) return -1;
    return Number(t.dataset.i);
  };

  const press = (i: number, x: number, y: number) => {
    if (i < 0) return;
    onPress(i, { x, y });
  };

  el.addEventListener(
    "pointerdown",
    (e) => {
      e.preventDefault();
      // Touch pointers are captured by the element they start on; let go so
      // moving onto other bars works everywhere.
      try {
        (e.target as Element).releasePointerCapture?.(e.pointerId);
      } catch {
        /* fine */
      }
      const i = barAt(e.clientX, e.clientY);
      fingers.set(e.pointerId, i);
      press(i, e.clientX, e.clientY);
    },
    { signal },
  );
  el.addEventListener(
    "pointermove",
    (e) => {
      if (!fingers.has(e.pointerId)) return;
      const i = barAt(e.clientX, e.clientY);
      if (i === fingers.get(e.pointerId)) return;
      fingers.set(e.pointerId, i);
      press(i, e.clientX, e.clientY);
    },
    { signal },
  );
  for (const type of ["pointerup", "pointercancel"]) {
    window.addEventListener(type, (e) => fingers.delete((e as PointerEvent).pointerId), { signal });
  }
  el.addEventListener("contextmenu", (e) => e.preventDefault(), { signal });

  function hit(i: number, at?: { x: number; y: number }) {
    const b = bars[i];
    if (!b) return;
    b.classList.remove("hit");
    void b.offsetWidth;
    b.classList.add("hit");
    // A little musical note floats up.
    const box = el.getBoundingClientRect();
    const r = b.getBoundingClientRect();
    const x = (at?.x ?? r.left + r.width / 2) - box.left;
    const y = (at?.y ?? r.top + r.height / 2) - box.top;
    const n = h("span", { class: "mx-note", html: noteArt(BAR_COLORS[i], Math.random() < 0.4) });
    n.style.left = `${x}px`;
    n.style.top = `${y}px`;
    n.style.setProperty("--dx", `${Math.round(Math.random() * 80 - 40)}px`);
    n.style.setProperty("--r", `${Math.round(Math.random() * 50 - 25)}deg`);
    n.addEventListener("animationend", () => n.remove());
    fx.append(n);
    setTimeout(() => n.remove(), 1500);
  }

  function glow(i: number | null) {
    bars.forEach((b, j) => b.classList.toggle("next", j === i));
    row.classList.toggle("guiding", i != null);
  }

  function nudge(i: number) {
    const b = bars[i];
    if (!b) return;
    b.classList.remove("boing");
    void b.offsetWidth;
    b.classList.add("boing");
    setTimeout(() => b.classList.remove("boing"), 500);
  }

  return { el, bars, hit, glow, nudge };
}
