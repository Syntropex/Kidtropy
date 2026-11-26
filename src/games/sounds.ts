/**
 * Sounds — the soundboard. Every button plays a real recording right away,
 * then says the name: tap the cow, hear a real "moo", then "Cow!".
 * Tabs along the top pick farm, wild animals, dinosaurs, trucks, diggers or racing.
 */
import { ITEMS, THEMES, type Item, type Theme } from "../data/items";
import { loadBuffer } from "../lib/audio";
import { speak } from "../lib/speech";
import { settings } from "../lib/store";
import { bounce, h, icon, pic } from "../lib/ui";
import { hasRealSound, line, SAY } from "../voice/lines";
import type { Game } from "./types";

const TAB_ORDER: Theme[] = ["farm", "animals", "dinos", "trucks", "construction", "racing"];

function itemsIn(theme: Theme): Item[] {
  return ITEMS.filter((i) => hasRealSound(i) && i.themes.includes(theme));
}

export const sounds: Game = {
  id: "sounds",
  title: "Sounds",
  icon: "🐮",
  color: "#66bb6a",
  start(scene) {
    const { root } = scene;
    const tabs = TAB_ORDER.map((id) => THEMES.find((t) => t.id === id)!).filter((t) => itemsIn(t.id).length > 0);
    // Start on the grown-up's favorite theme if there is one.
    let current: Theme = tabs.find((t) => settings.themes.includes(t.id))?.id ?? tabs[0].id;

    const tabRow = h("div", { class: "sound-tabs", role: "tablist" });
    const board = h("div", { class: "sound-board" });
    root.replaceChildren(h("div", { class: "sounds-wrap" }, tabRow, board));

    function drawTabs() {
      tabRow.replaceChildren(
        ...tabs.map((t) =>
          h(
            "button",
            {
              class: `sound-tab${t.id === current ? " on" : ""}`,
              style: `--c:${t.color}`,
              role: "tab",
              "aria-selected": String(t.id === current),
              "aria-label": t.label,
              onclick: () => {
                if (current === t.id) return;
                current = t.id;
                drawTabs();
                fill();
                void speak(line.theme(t.id, true));
              },
            },
            icon(t.icon),
          ),
        ),
      );
    }

    function fill() {
      const items = itemsIn(current);
      // Warm up the sounds so the first tap is instant.
      for (const i of items) void loadBuffer(`/sounds/${i.id}.mp3`);
      board.replaceChildren(
        ...items.map((item, i) => {
          const b = h("button", { class: "sound-tile pop-in", "aria-label": item.name, style: `animation-delay:${i * 30}ms` }, pic(item));
          b.onclick = async () => {
            board.querySelectorAll(".sound-tile.playing").forEach((x) => x.classList.remove("playing"));
            b.classList.add("playing");
            bounce(b);
            notes(b);
            await speak(`[[snd:${item.id}]] ${line.name(item)}`);
            b.classList.remove("playing");
          };
          return b;
        }),
      );
    }

    drawTabs();
    fill();
    void speak(SAY.soundsIntro);
  },
};

/** Little music notes float up from a tapped tile. */
function notes(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  for (let i = 0; i < 3; i++) {
    const n = h("div", { class: "float-note", "aria-hidden": "true" }, ["♪", "♫", "♬"][i]);
    n.style.left = `${r.left + r.width * (0.25 + Math.random() * 0.5)}px`;
    n.style.top = `${r.top + r.height * 0.3}px`;
    n.style.animationDelay = `${i * 120}ms`;
    n.style.setProperty("--dx", `${(Math.random() - 0.5) * 80}px`);
    document.body.append(n);
    setTimeout(() => n.remove(), 1500);
  }
}
