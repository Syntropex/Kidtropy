/**
 * Count It — tap each thing to count it out loud, then pick how many.
 */
import { speak } from "../lib/speech";
import { sfx } from "../lib/sfx";
import { settings } from "../lib/store";
import { bounce, h, makeDeck, pic, pool, reward, shuffle, wait, wiggle } from "../lib/ui";
import { line } from "../voice/lines";
import type { Game } from "./types";



export const count: Game = {
  id: "count",
  title: "Count It",
  icon: "🔢",
  color: "#29b6f6",
  start(scene) {
    const { root } = scene;
    const next = makeDeck(pool);
    const field = h("div", { class: "count-field" });
    const tally = h("div", { class: "tally", "aria-live": "polite" });
    const answers = h("div", { class: "number-row" });
    root.replaceChildren(h("div", { class: "count-wrap" }, tally, field, answers));
    let round = 0;

    async function play() {
      const id = ++round;
      const live = () => scene.alive() && id === round;
      const item = next();
      const max = Math.max(3, Math.min(10, settings.countMax));
      const total = 1 + Math.floor(Math.random() * max);
      let counted = 0;
      answers.replaceChildren();
      tally.textContent = "";
      field.replaceChildren();
      field.dataset.n = String(total);

      // Scatter them on a loose grid so nothing overlaps.
      const cols = total <= 4 ? 2 : total <= 6 ? 3 : 4;
      const rows = Math.ceil(total / cols);
      const cells = shuffle([...Array(cols * rows).keys()]).slice(0, total);
      cells.forEach((cell, i) => {
        const c = cell % cols;
        const r = Math.floor(cell / cols);
        const b = h("button", { class: "count-thing pop-in", "aria-label": item.name }, pic(item));
        b.style.left = `${((c + 0.5) / cols) * 100}%`;
        b.style.top = `${((r + 0.5) / rows) * 100}%`;
        b.style.setProperty("--size", `${Math.min(30, 80 / Math.max(cols, rows + 0.5))}vmin`);
        b.style.animationDelay = `${i * 70}ms`;
        b.onclick = () => {
          if (b.classList.contains("counted") || !live()) return;
          counted++;
          b.classList.add("counted");
          b.dataset.num = String(counted);
          bounce(b);
          sfx.pop();
          tally.textContent = String(counted);
          void speak(line.number(counted));
          if (counted === total) void finished();
        };
        field.append(b);
      });

      async function finished() {
        await wait(600);
        if (!live()) return;
        await speak(line.countAsk(item, total));
        if (!live()) return;
        const opts = new Set([total]);
        while (opts.size < 3) {
          const n = Math.max(1, Math.min(max + 1, total + Math.round((Math.random() - 0.5) * 4)));
          opts.add(n);
        }
        let solved = false;
        answers.replaceChildren(
          ...[...opts].sort((a, b) => a - b).map((n) => {
            const b = h("button", { class: "number-btn pop-in", "aria-label": String(n) }, h("span", { class: "digit" }, String(n)), h("span", { class: "dots", "aria-hidden": "true" }, "•".repeat(n)));
            b.onclick = async () => {
              if (solved || !live()) return;
              if (n === total) {
                solved = true;
                bounce(b);
                b.classList.add("right");
                void reward(b);
                await speak(line.countWin(total));
                await wait(800);
                if (live()) void play();
              } else {
                wiggle(b);
                void speak(line.countWrong(n));
                field.querySelectorAll<HTMLElement>(".count-thing").forEach((t, i) => setTimeout(() => bounce(t), i * 350));
              }
            };
            return b;
          }),
        );
      }

      await wait(300);
      if (live()) await speak(line.countStart(item));
    }

    void play();
  },
};
