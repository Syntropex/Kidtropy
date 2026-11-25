/**
 * Sounds — a talking picture board. Tap the cow: "The cow says moo!"
 */
import { ITEMS } from "../data/items";
import { sfx } from "../lib/sfx";
import { speak } from "../lib/speech";
import { bounce, h, pic, pool, shuffle } from "../lib/ui";
import type { Game } from "./types";

export const sounds: Game = {
  id: "sounds",
  title: "Sounds",
  icon: "🐮",
  color: "#66bb6a",
  start(scene) {
    const { root } = scene;
    void speak("What do they say? Tap to find out!");
    const board = h("div", { class: "sound-board" });
    const more = h("button", { class: "round-btn more-btn", "aria-label": "More pictures" }, "🔄");
    root.replaceChildren(h("div", { class: "sounds-wrap" }, board, more));

    function fill() {
      let items = pool().filter((i) => i.sound);
      if (items.length < 6) items = ITEMS.filter((i) => i.sound);
      board.replaceChildren(
        ...shuffle(items)
          .slice(0, 12)
          .map((item, i) => {
            const b = h("button", { class: "sound-tile pop-in", "aria-label": item.name, style: `animation-delay:${i * 40}ms` }, pic(item));
            b.onclick = () => {
              bounce(b);
              if (item.themes.includes("trucks") || item.themes.includes("racing")) sfx.honk();
              else sfx.pop();
              const verb = item.themes.some((t) => t === "animals" || t === "farm" || t === "dinos") ? "says" : "goes";
              void speak(`The ${item.name} ${verb}... ${item.sound}`, { pitch: 1.2 });
            };
            return b;
          }),
      );
    }
    more.onclick = () => {
      sfx.whoosh();
      fill();
    };
    fill();
  },
};
