/**
 * ABC — tap a letter: "B is for bulldozer! B, B, bulldozer!"
 * Words prefer the grown-up's chosen themes.
 */
import { ABC_WORDS, abcItems } from "../data/abc";
import type { Item } from "../data/items";
import { sfx } from "../lib/sfx";
import { speak } from "../lib/speech";
import { settings } from "../lib/store";
import { bounce, h, icon, pic } from "../lib/ui";
import type { Game } from "./types";
import { line, SAY } from "../voice/lines";

const LETTERS = Object.keys(ABC_WORDS);
const TILE_COLORS = ["#ef5350", "#ffa726", "#ffee58", "#66bb6a", "#29b6f6", "#7e57c2", "#ec407a"];

function wordFor(letter: string, nth: number): Item {
  const raw = abcItems(letter);
  const themed = settings.themes.length ? raw.filter((i) => i.themes.some((t) => settings.themes.includes(t))) : [];
  const list = themed.length ? [...themed, ...raw.filter((i) => !themed.includes(i))] : raw;
  return list[nth % list.length];
}

export const abc: Game = {
  id: "abc",
  title: "ABC",
  icon: "🔤",
  color: "#ffa726",
  start(scene) {
    const { root } = scene;
    void speak(SAY.abcIntro);
    const taps: Record<string, number> = {};
    const grid = h(
      "div",
      { class: "abc-grid" },
      ...LETTERS.map((L, i) => {
        const b = h("button", { class: "abc-tile", style: `--c:${TILE_COLORS[i % TILE_COLORS.length]}`, "aria-label": L }, L);
        b.onclick = () => open(L);
        return b;
      }),
    );
    root.replaceChildren(grid);

    function open(L: string) {
      const n = (taps[L] = (taps[L] ?? -1) + 1);
      const item = wordFor(L, n);
      const idx = LETTERS.indexOf(L);
      sfx.pop();
      const card = h(
        "div",
        { class: "abc-card pop-in" },
        h("div", { class: "abc-big", style: `--c:${TILE_COLORS[idx % TILE_COLORS.length]}` }, h("span", {}, L), h("span", { class: "lower" }, L.toLowerCase())),
        h("button", { class: "abc-pic", "aria-label": item.name, onclick: (e: Event) => (bounce(e.currentTarget as Element), void speak(line.tapItem(item))) }, pic(item)),
        h("div", { class: "big-word" }, h("b", {}, item.name.charAt(0).toUpperCase()), item.name.slice(1)),
      );
      const overlay = h(
        "div",
        { class: "overlay abc-overlay", role: "dialog", "aria-label": `Letter ${L}` },
        card,
        h(
          "div",
          { class: "abc-nav" },
          h("button", { class: "round-btn", "aria-label": "Previous letter", onclick: () => go(-1) }, icon("⬅️")),
          h("button", { class: "round-btn", "aria-label": "Back to letters", onclick: () => close() }, icon("🔤")),
          h("button", { class: "round-btn", "aria-label": "Next letter", onclick: () => go(1) }, icon("➡️")),
        ),
      );
      const close = () => overlay.remove();
      const go = (d: number) => {
        close();
        open(LETTERS[(idx + d + LETTERS.length) % LETTERS.length]);
      };
      root.querySelector(".abc-overlay")?.remove();
      root.append(overlay);
      void speak(line.letter(L, item.name));
    }
  },
};
