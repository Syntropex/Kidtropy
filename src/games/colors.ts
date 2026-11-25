/**
 * Colors — "Tap the blue truck!"
 */
import { colorCar, colorTruck, raceCar } from "../art/art";
import { speak } from "../lib/speech";
import { settings } from "../lib/store";
import { bounce, choiceGrid, icon, h, makeDeck, pickOne, reward, shuffle, wait, wiggle } from "../lib/ui";
import { COLOR_YES, line } from "../voice/lines";
import type { Game } from "./types";

export const COLORS = [
  { name: "red", css: "#e53935" },
  { name: "blue", css: "#1e88e5" },
  { name: "green", css: "#43a047" },
  { name: "yellow", css: "#fdd835" },
  { name: "orange", css: "#fb8c00" },
  { name: "purple", css: "#8e24aa" },
  { name: "pink", css: "#f06292" },
  { name: "black", css: "#37373f" },
  { name: "white", css: "#fafafa" },
  { name: "brown", css: "#8d6e63" },
];

const SHAPES = [
  { name: "car", draw: colorCar },
  { name: "truck", draw: colorTruck },
  { name: "race car", draw: raceCar },
];

export const colors: Game = {
  id: "colors",
  title: "Colors",
  icon: "🎨",
  color: "#ab47bc",
  start(scene) {
    const { root } = scene;
    // Start with the easy, very different colors.
    const next = makeDeck(() => COLORS, 4);
    const prompt = h("button", { class: "prompt-btn", "aria-label": "Hear it again" }, icon("🔊"));
    const board = h("div", { class: "choice-grid" });
    root.replaceChildren(h("div", { class: "find-wrap" }, prompt, board));
    let round = 0;

    async function play() {
      const id = ++round;
      const live = () => scene.alive() && id === round;
      const target = next();
      const shape = pickOne(SHAPES);
      const n = Math.max(2, Math.min(6, settings.choices));
      const others = shuffle(COLORS.filter((c) => c !== target)).slice(0, n - 1);
      const options = shuffle([target, ...others]);
      const question = pickOne(line.colorQuestions(target.name, shape.name));
      let done = false;

      choiceGrid(board, n);
      board.replaceChildren(
        ...options.map((c) => {
          const b = h("button", { class: "choice pop-in", "aria-label": `${c.name} ${shape.name}` }, h("span", { class: "pic art", html: shape.draw(c.css) }));
          b.onclick = async () => {
            if (done || !live()) return;
            if (c === target) {
              done = true;
              bounce(b);
              b.classList.add("right");
              board.querySelectorAll(".choice").forEach((x) => x !== b && x.classList.add("fade"));
              void reward(b);
              await speak(line.colorWin(pickOne(COLOR_YES), target.name));
              await wait(700);
              if (live()) void play();
            } else {
              wiggle(b);
              await speak(line.colorWrong(c.name, target.name));
            }
          };
          return b;
        }),
      );
      prompt.onclick = () => speak(question);
      await wait(250);
      if (live()) await speak(question);
    }

    void play();
  },
};
