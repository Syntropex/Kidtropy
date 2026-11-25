/**
 * Counting board: two ten frames. Tap a box to put a counter in it, tap a
 * counter to take it away. We say the count after every change.
 */
import { byId, type Item } from "../../data/items";
import { sfx } from "../../lib/sfx";
import { speak } from "../../lib/speech";
import { bounce, confetti, h, pic, wiggle } from "../../lib/ui";
import { grade } from "../progress";
import type { Tool } from "../types";
import { boxVars, cap, numberLines, sayNumber, toolBtn } from "./common";

const CELLS = 20;
const ITEM_IDS = ["dumptruck", "trex", "duck", "racecar", "apple"];
const items = (): Item[] => ITEM_IDS.map((id) => byId.get(id)).filter((i): i is Item => !!i);

const SAY = {
  intro: "Tap a box to add one. Tap it again to take it away!",
  ten: "Ten! One ten frame is full!",
  twenty: "Twenty! Both ten frames are full!",
};

export const counters: Tool = {
  id: "counters",
  grades: ["prek", "k", "g1"],
  title: "Counting Board",
  icon: "🔢",
  lines() {
    return [...Object.values(SAY), ...numberLines(0, CELLS), ...items().map((i) => `${cap(i.name)}!`)];
  },
  start(scene) {
    const { root, signal } = scene;
    const all = items();
    let item = all[0];
    const filled = new Array<boolean>(CELLS).fill(false);
    const showNumber = grade() !== "prek";

    const cells = filled.map((_, i) => {
      const b = h("button", { class: "t-cell", "aria-label": `Box ${i + 1}`, onclick: () => toggle(i) });
      return b;
    });
    const frames = h(
      "div",
      { class: "t-frames" },
      h("div", { class: "t-frame" }, ...cells.slice(0, 10)),
      h("div", { class: "t-frame" }, ...cells.slice(10)),
    );
    const num = h("div", { class: `t-count-num${showNumber ? "" : " hidden"}`, "aria-live": "polite" }, "0");

    const pickBtns = all.map((it) =>
      h(
        "button",
        {
          class: `t-chip${it === item ? " on" : ""}`,
          "aria-label": it.name,
          onclick: (e: MouseEvent) => {
            item = it;
            pickBtns.forEach((b) => b.classList.toggle("on", b === e.currentTarget));
            bounce(e.currentTarget as Element);
            sfx.tap();
            cells.forEach((c, i) => filled[i] && c.replaceChildren(counter()));
            void speak(`${cap(it.name)}!`);
          },
        },
        pic(it),
      ),
    );

    const plus: HTMLButtonElement = h(
      "button",
      {
        class: "t-btn t-plus",
        "aria-label": "Add one",
        onclick: () => {
          const i = filled.indexOf(false);
          if (i < 0) wiggle(plus);
          else toggle(i);
        },
      },
      "+",
    );
    const clear = toolBtn("🧽", "Clear", () => {
      if (!count()) return;
      sfx.whoosh();
      filled.fill(false);
      cells.forEach((c) => c.replaceChildren());
      update();
    });

    const box = h("div", { class: "t-frames-box" }, frames);
    root.replaceChildren(
      h(
        "div",
        { class: "t-wrap t-counters" },
        h("div", { class: "t-chips", role: "group", "aria-label": "Pick a counter" }, ...pickBtns),
        box,
        h("div", { class: "t-count-bar" }, clear, num, plus),
      ),
    );

    boxVars(box, signal);

    function counter() {
      return h("span", { class: "t-counter pop-in" }, pic(item));
    }

    function count() {
      return filled.filter(Boolean).length;
    }

    function toggle(i: number) {
      const c = cells[i];
      if (filled[i]) {
        filled[i] = false;
        sfx.tap();
        const old = c.firstElementChild;
        old?.classList.add("t-poof");
        setTimeout(() => !filled[i] && old?.remove(), 220);
      } else {
        filled[i] = true;
        sfx.pop();
        c.replaceChildren(counter());
      }
      update();
    }

    function update() {
      const n = count();
      num.textContent = String(n);
      bounce(num);
      if (n === CELLS) {
        confetti(40, center(frames));
        void speak(SAY.twenty);
      } else if (n === 10 && filled.slice(0, 10).every(Boolean)) {
        void speak(SAY.ten);
      } else {
        void speak(sayNumber(n));
      }
    }

    void speak(SAY.intro);
  },
};

function center(el: Element) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}
