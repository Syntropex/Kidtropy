/**
 * Find It — "Where's the excavator? Tap the excavator!"
 * Sometimes asks by sound instead: "Who says moo?"
 */
import type { Item } from "../data/items";
import { speak } from "../lib/speech";
import { settings } from "../lib/store";
import { bounce, choiceGrid, icon, h, makeDeck, pic, pickOne, pool, reward, shuffle, wait, wiggle } from "../lib/ui";
import { FIND_YES, hasRealSound, line } from "../voice/lines";
import type { Game } from "./types";

export const find: Game = {
  id: "find",
  title: "Find It",
  icon: "👆",
  color: "#ef5350",
  start(scene) {
    const { root } = scene;
    const next = makeDeck(pool);
    const prompt = h("button", { class: "prompt-btn", "aria-label": "Hear it again" }, icon("🔊"));
    const board = h("div", { class: "choice-grid" });
    root.replaceChildren(h("div", { class: "find-wrap" }, prompt, board));
    let round = 0;

    async function play() {
      const id = ++round;
      const live = () => scene.alive() && id === round;
      const target = next();
      const n = Math.max(2, Math.min(6, settings.choices));
      // Distractors must not share a name/alias with the target ("truck"!).
      const others = shuffle(pool().filter((i) => i.id !== target.id && i.name !== target.name && !(i.aliases ?? []).includes(target.name))).slice(0, n - 1);
      const options = shuffle([target, ...others]);
      const bySound = !!target.sound && Math.random() < (hasRealSound(target) ? 0.45 : 0.25) && options.every((o) => o === target || o.sound !== target.sound);
      const question = bySound ? line.whoSays(target) : pickOne(line.findQuestions(target));
      let done = false;

      choiceGrid(board, n);
      board.replaceChildren(
        ...options.map((item) => {
          const b = h("button", { class: "choice pop-in", "aria-label": item.name }, pic(item));
          b.onclick = () => choose(item, b);
          return b;
        }),
      );
      prompt.onclick = () => speak(question);

      async function choose(item: Item, el: HTMLElement) {
        if (done || !live()) return;
        if (item === target) {
          done = true;
          bounce(el);
          el.classList.add("right");
          board.querySelectorAll(".choice").forEach((c) => c !== el && c.classList.add("fade"));
          void reward(el);
          await speak(line.findWin(item, pickOne(FIND_YES)));
          await wait(700);
          if (live()) void play();
        } else {
          wiggle(el);
          await speak(line.findWrong(item, bySound ? question : line.findThe(target)));
        }
      }

      await wait(250);
      if (live()) await speak(question);
    }

    void play();
  },
};
