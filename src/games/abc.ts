/**
 * ABC — tap a letter: "B is for bulldozer! B, B, bulldozer!"
 * Words prefer the grown-up's chosen themes.
 */
import { byId, type Item } from "../data/items";
import { sfx } from "../lib/sfx";
import { speak } from "../lib/speech";
import { settings } from "../lib/store";
import { bounce, capitalize, h, pic } from "../lib/ui";
import type { Game } from "./types";

/** Item ids (from data/items.ts) or ad-hoc {name, emoji} for letters we lack. */
const WORDS: Record<string, (string | { name: string; emoji: string })[]> = {
  A: ["airplane", "ambulance", "apple"],
  B: ["bulldozer", "bus", "bear", "bee"],
  C: ["car", "cow", "crane", "crocodile", "cone"],
  D: ["dumptruck", "duck", "dog"],
  E: ["excavator", "elephant", "egg"],
  F: ["firetruck", "frog", "farmer", "flag"],
  G: ["garbage", "giraffe", "goat"],
  H: ["helicopter", "horse", "hammer"],
  I: [{ name: "ice cream", emoji: "🍦" }],
  J: [{ name: "juice", emoji: "🧃" }, { name: "jellyfish", emoji: "🪼" }],
  K: [{ name: "kangaroo", emoji: "🦘" }, { name: "kite", emoji: "🪁" }],
  L: ["lion", { name: "ladder", emoji: "🪜" }],
  M: ["monster", "mixer", "monkey", "motorcycle", "medal"],
  N: [{ name: "nest", emoji: "🪺" }, { name: "nose", emoji: "👃" }],
  O: ["octopus", "owl"],
  P: ["pickup", "pig", "police", "pterodactyl", "penguin"],
  Q: [{ name: "queen", emoji: "👸" }],
  R: ["racecar", "roller", "rooster", "rocket"],
  S: ["stegosaurus", "semi", "sheep", "snake", "shark"],
  T: ["tractor", "trex", "train", "triceratops", "tow", "trophy", "turtle"],
  U: [{ name: "umbrella", emoji: "☂️" }, { name: "unicorn", emoji: "🦄" }],
  V: ["volcano", { name: "van", emoji: "🚐" }],
  W: ["whale", "wheel"],
  X: [{ name: "x-ray", emoji: "🩻" }],
  Y: [{ name: "yo-yo", emoji: "🪀" }, { name: "yak", emoji: "🐃" }],
  Z: ["zebra"],
};

const LETTERS = Object.keys(WORDS);
const TILE_COLORS = ["#ef5350", "#ffa726", "#ffee58", "#66bb6a", "#29b6f6", "#7e57c2", "#ec407a"];

function wordFor(letter: string, nth: number): Item {
  const raw = WORDS[letter].map((w) => (typeof w === "string" ? byId.get(w)! : ({ id: w.name, name: w.name, emoji: w.emoji, themes: [] } as Item)));
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
    void speak("A, B, C! Tap a letter!");
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
        h("button", { class: "abc-pic", "aria-label": item.name, onclick: (e: Event) => (bounce(e.currentTarget as Element), void speak(`${capitalize(item.name)}! ${item.sound ?? ""}`)) }, pic(item)),
        h("div", { class: "big-word" }, h("b", {}, item.name.charAt(0).toUpperCase()), item.name.slice(1)),
      );
      const overlay = h(
        "div",
        { class: "overlay abc-overlay", role: "dialog", "aria-label": `Letter ${L}` },
        card,
        h(
          "div",
          { class: "abc-nav" },
          h("button", { class: "round-btn", "aria-label": "Previous letter", onclick: () => go(-1) }, "⬅️"),
          h("button", { class: "round-btn", "aria-label": "Back to letters", onclick: () => close() }, "🔤"),
          h("button", { class: "round-btn", "aria-label": "Next letter", onclick: () => go(1) }, "➡️"),
        ),
      );
      const close = () => overlay.remove();
      const go = (d: number) => {
        close();
        open(LETTERS[(idx + d + LETTERS.length) % LETTERS.length]);
      };
      root.querySelector(".abc-overlay")?.remove();
      root.append(overlay);
      // TTS reads a lone "A" as the word "uh", so spell it the way it sounds.
      const l = L === "A" ? "Ay" : L;
      void speak(`${l}! ${l} is for ${item.name}! ${l}, ${l}, ${item.name}!`);
    }
  },
};
