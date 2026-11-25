/**
 * Clock: drag the hands of an analog clock (the hour hand follows the minute
 * hand, like a real clock). We show the digital time and say it when you let go.
 */
import { sfx } from "../../lib/sfx";
import { speak } from "../../lib/speech";
import { bounce, h, pickOne } from "../../lib/ui";
import type { Tool } from "../types";
import { boxVars, numberWord, on, toolBtn } from "./common";

const SAY = {
  intro: "Drag the clock hands to change the time!",
};

/** "It's three o'clock." / "It's three oh five." / "It's three fifteen." */
export function timeSay(hour: number, min: number): string {
  const hw = numberWord(hour);
  if (min === 0) return `It's ${hw} o'clock.`;
  if (min < 10) return `It's ${hw} oh ${numberWord(min)}.`;
  return `It's ${hw} ${numberWord(min)}.`;
}

const NS = "http://www.w3.org/2000/svg";
function s<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}, ...kids: Node[]): SVGElementTagNameMap[K] {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  el.append(...kids);
  return el;
}

const NUMBER_COLORS = ["#e53935", "#fb8c00", "#f9a825", "#43a047", "#1e88e5", "#8e24aa"];

export const clock: Tool = {
  id: "clock",
  grades: ["k", "g1"],
  title: "Clock",
  icon: "🕒",
  lines() {
    const out = [...Object.values(SAY)];
    for (let hr = 1; hr <= 12; hr++) for (let m = 0; m < 60; m += 5) out.push(timeSay(hr, m));
    return out;
  },
  start(scene) {
    const { root, signal } = scene;
    /** Minutes since 12:00, not wrapped, so hands always turn the short way. */
    let t = 3 * 60;

    // ---- Face ---------------------------------------------------------------
    const face = s("svg", { viewBox: "-110 -110 220 220", class: "t-clock-face", role: "img", "aria-label": "Clock" });
    face.append(
      s("circle", { r: 106, class: "rim" }),
      s("circle", { r: 98, class: "dial" }),
    );
    for (let i = 0; i < 60; i++) {
      const big = i % 5 === 0;
      const a = (i * 6 * Math.PI) / 180;
      const r1 = big ? 84 : 89;
      face.append(
        s("line", {
          x1: Math.sin(a) * r1,
          y1: -Math.cos(a) * r1,
          x2: Math.sin(a) * 94,
          y2: -Math.cos(a) * 94,
          class: big ? "tick big" : "tick",
        }),
      );
    }
    for (let n = 1; n <= 12; n++) {
      const a = (n * 30 * Math.PI) / 180;
      const txt = s("text", { x: Math.sin(a) * 70, y: -Math.cos(a) * 70, class: "num", fill: NUMBER_COLORS[n % NUMBER_COLORS.length] });
      txt.textContent = String(n);
      face.append(txt);
    }
    const hand = (cls: string, len: number, width: number, knob: number) =>
      s(
        "g",
        { class: `hand ${cls}` },
        s("line", { x1: 0, y1: 12, x2: 0, y2: -len, "stroke-width": width, "stroke-linecap": "round" }),
        s("circle", { cx: 0, cy: -len, r: knob }),
      );
    const hourHand = hand("hour", 46, 11, 10);
    const minHand = hand("minute", 78, 7, 9);
    face.append(hourHand, minHand, s("circle", { r: 8, class: "pin" }));

    const digital = h("div", { class: "t-digital", "aria-live": "polite" });
    const sayBtn = toolBtn("🔊", "Say the time", () => {
      bounce(digital);
      void speak(spoken());
    });
    const diceBtn = toolBtn("🎲", "Pick a time", () => randomTime());

    const box = h("div", { class: "t-clock-box" }, face);
    root.replaceChildren(
      h(
        "div",
        { class: "t-wrap t-clock" },
        box,
        h("div", { class: "t-clock-side" }, digital, h("div", { class: "t-bar-row" }, sayBtn, diceBtn)),
      ),
    );

    boxVars(box, signal);

    const wrapped = () => ((Math.round(t / 5) * 5) % 720 + 720) % 720;
    const hourMin = () => {
      const w = wrapped();
      return { hr: Math.floor(w / 60) || 12, min: w % 60 };
    };
    const spoken = () => {
      const { hr, min } = hourMin();
      return timeSay(hr, min);
    };

    function paint() {
      minHand.style.transform = `rotate(${t * 6}deg)`;
      hourHand.style.transform = `rotate(${t / 2}deg)`;
      const { hr, min } = hourMin();
      digital.textContent = `${hr}:${String(min).padStart(2, "0")}`;
    }

    function animate(ms: number) {
      face.style.setProperty("--turn", `${ms}ms`);
      face.classList.add("turning");
      setTimeout(() => face.classList.remove("turning"), ms + 50);
    }

    // ---- Dragging -------------------------------------------------------------
    let dragging: "hour" | "minute" | null = null;
    let lastMin = -1;

    const polar = (e: PointerEvent) => {
      const r = face.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width - 0.5) * 220;
      const y = ((e.clientY - r.top) / r.height - 0.5) * 220;
      return { a: ((Math.atan2(x, -y) * 180) / Math.PI + 360) % 360, r: Math.hypot(x, y) };
    };
    const diff = (a: number, b: number) => Math.abs((((a - b) % 360) + 540) % 360 - 180);

    function moveTo(p: { a: number }) {
      if (dragging === "minute") {
        const cur = ((t * 6) % 360 + 360) % 360;
        const delta = ((p.a - cur + 540) % 360) - 180;
        t += delta / 6;
      } else if (dragging === "hour") {
        const min = ((t % 60) + 60) % 60;
        const base = Math.floor(t / 720) * 720;
        let hr = Math.round(p.a / 30 - min / 60);
        hr = ((hr % 12) + 12) % 12;
        // Keep t near where it was so the hands turn the short way.
        let next = base + hr * 60 + min;
        while (next - t > 360) next -= 720;
        while (t - next > 360) next += 720;
        t = next;
      }
      paint();
      const m = wrapped();
      if (m !== lastMin) {
        lastMin = m;
        sfx.tap();
      }
    }

    on(
      face,
      "pointerdown",
      (e: PointerEvent) => {
        e.preventDefault();
        const p = polar(e);
        if (!(p.r <= 112)) return;
        const dm = diff(p.a, ((t * 6) % 360 + 360) % 360);
        const dh = diff(p.a, ((t / 2) % 360 + 360) % 360);
        dragging = dm <= dh ? "minute" : "hour";
        if (p.r < 60 && dh < 35) dragging = "hour";
        if (p.r >= 60 && dm < 35) dragging = "minute";
        face.classList.remove("turning");
        face.classList.add(`drag-${dragging}`);
        try {
          face.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        lastMin = wrapped();
        moveTo(p);
      },
      signal,
    );
    on(face, "pointermove", (e: PointerEvent) => dragging && moveTo(polar(e)), signal);
    const end = () => {
      if (!dragging) return;
      face.classList.remove(`drag-${dragging}`);
      dragging = null;
      t = Math.round(t / 5) * 5;
      animate(200);
      paint();
      bounce(digital);
      void speak(spoken());
    };
    on(face, "pointerup", end, signal);
    on(face, "pointercancel", end, signal);

    function randomTime() {
      const cur = wrapped();
      let target = cur;
      while (target === cur) target = pickOne([...Array(12).keys()]) * 60 + pickOne([0, 30]);
      t = Math.round(t / 5) * 5 + ((target - cur + 720) % 720);
      sfx.whoosh();
      animate(900);
      paint();
      setTimeout(() => {
        if (!scene.alive()) return;
        bounce(digital);
        void speak(spoken());
      }, 900);
    }

    paint();
    void speak(SAY.intro);
  },
};
