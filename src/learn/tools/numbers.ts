/**
 * Number chart: 1–100 (Kindergarten) or 1–120 (1st grade). Tap a number to
 * hear it, light up the 5s or 10s, or press play to count along.
 */
import { sfx } from "../../lib/sfx";
import { speak, stopSpeaking } from "../../lib/speech";
import { bounce, h, icon } from "../../lib/ui";
import { grade } from "../progress";
import type { Tool } from "../types";
import { boxVars, numberLines, sayNumber } from "./common";

type Step = 1 | 5 | 10;

const MODES: { step: Step; label: string; say: string }[] = [
  { step: 1, label: "1s", say: "Count by ones!" },
  { step: 5, label: "5s", say: "Count by fives!" },
  { step: 10, label: "10s", say: "Count by tens!" },
];

const SAY = {
  intro: "Tap a number to hear it. Press play to count with me!",
  countWithMe: "Count with me!",
  done: "Great counting!",
};

export const numbers: Tool = {
  id: "numbers",
  grades: ["k", "g1"],
  title: "Number Chart",
  icon: "💯",
  lines() {
    return [...Object.values(SAY), ...MODES.map((m) => m.say), ...numberLines(1, 120)];
  },
  start(scene) {
    const { root, signal } = scene;
    const max = grade() === "g1" ? 120 : 100;
    let step: Step = 1;
    let run = 0; // counting run id; bump to stop
    let counting = false;

    const cells = Array.from({ length: max }, (_, i) => {
      const n = i + 1;
      return h(
        "button",
        {
          class: "t-num",
          "data-n": String(n),
          "aria-label": String(n),
          onclick: (e: MouseEvent) => {
            stop();
            const b = e.currentTarget as HTMLElement;
            flash(b);
            sfx.tap();
            void speak(sayNumber(n));
          },
        },
        String(n),
      );
    });
    const grid = h("div", { class: "t-chart", style: `--rows:${max / 10}` }, ...cells);

    const modeBtns = MODES.map((m) =>
      h(
        "button",
        {
          class: `t-chip t-mode${m.step === step ? " on" : ""}`,
          "aria-label": m.say,
          onclick: (e: MouseEvent) => {
            stop();
            step = m.step;
            modeBtns.forEach((b) => b.classList.toggle("on", b === e.currentTarget));
            bounce(e.currentTarget as Element);
            sfx.tap();
            paintSkips();
            void speak(m.say);
          },
        },
        m.label,
      ),
    );
    const playBtn = h("button", { class: "t-btn t-play", "aria-label": "Count with me", onclick: () => (counting ? stop() : void countAlong()) }, icon("▶️"));

    const box = h("div", { class: "t-chart-box" }, grid);
    root.replaceChildren(
      h(
        "div",
        { class: "t-wrap t-numbers" },
        h("div", { class: "t-chips" }, ...modeBtns, playBtn),
        box,
      ),
    );

    boxVars(box, signal);

    function paintSkips() {
      cells.forEach((c, i) => c.classList.toggle("skip", step > 1 && (i + 1) % step === 0));
    }

    function flash(b: HTMLElement) {
      b.classList.remove("flash");
      void b.offsetWidth;
      b.classList.add("flash");
      bounce(b);
    }

    function setPlaying(on: boolean) {
      counting = on;
      playBtn.replaceChildren(icon(on ? "⏹️" : "▶️"));
      playBtn.setAttribute("aria-label", on ? "Stop" : "Count with me");
      playBtn.classList.toggle("on", on);
      if (!on) cells.forEach((c) => c.classList.remove("lit"));
    }

    function stop() {
      if (!counting) return;
      run++;
      setPlaying(false);
      stopSpeaking();
    }

    async function countAlong() {
      const id = ++run;
      const live = () => scene.alive() && id === run;
      setPlaying(true);
      sfx.tap();
      await speak(SAY.countWithMe);
      for (let n = step; n <= max && live(); n += step) {
        const c = cells[n - 1];
        c.classList.add("lit");
        flash(c);
        await speak(sayNumber(n));
      }
      if (!live()) return;
      await speak(SAY.done);
      if (live()) setPlaying(false);
    }

    signal.addEventListener("abort", () => run++);
    void speak(SAY.intro);
  },
};
