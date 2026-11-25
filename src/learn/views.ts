/** Small building blocks for drawing questions and answers. */
import type { Item } from "../data/items";
import { h, icon, pic } from "../lib/ui";

/** A huge number, letter or short word on an answer button. */
export function bigText(text: string, cls = ""): HTMLElement {
  return h("span", { class: `big-text ${cls}`, "data-len": String(text.length) }, text);
}

/** A word on an answer button (reading questions). */
export function wordText(text: string): HTMLElement {
  return h("span", { class: "word-text", "data-len": String(text.length) }, text);
}

/** An item's picture. */
export function itemPic(item: Item): HTMLElement {
  return pic(item);
}

/** An emoji glyph as a full-size picture (Fluent picture when available). */
export function glyphPic(glyph: string): HTMLElement {
  return h("span", { class: "pic art" }, icon(glyph, "fill"));
}

/** A row/grid of the same picture n times (for counting, adding...). */
export function group(item: Item, n: number, cls = ""): HTMLElement {
  return h("div", { class: `group ${cls}`, "data-n": String(n) }, ...Array.from({ length: n }, () => h("span", { class: "group-item" }, pic(item))));
}

/** A ten frame (or two) with n counters. */
export function tenFrame(n: number, item?: Item): HTMLElement {
  const frames = Math.max(1, Math.ceil(n / 10));
  return h(
    "div",
    { class: "ten-frames" },
    ...Array.from({ length: frames }, (_, f) =>
      h(
        "div",
        { class: "ten-frame" },
        ...Array.from({ length: 10 }, (_, i) => {
          const filled = f * 10 + i < n;
          return h("span", { class: `tf-cell${filled ? " on" : ""}` }, filled ? (item ? pic(item) : h("i", { class: "dot" })) : "");
        }),
      ),
    ),
  );
}

/** A centered stage for the question's picture/equation. */
export function stage(...children: (HTMLElement | string)[]): HTMLElement {
  return h("div", { class: "q-stage" }, ...children);
}

/** "3 + 4 = ?" style equation. */
export function equation(text: string): HTMLElement {
  return h("div", { class: "equation" }, text);
}
