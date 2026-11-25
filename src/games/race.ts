/**
 * Race! — pick a race car, wait for the green light, tap GO as fast as you can.
 * Rivals rubber-band to stay close, so it's exciting but little racers usually win.
 */
import { raceCar } from "../art/art";
import { sfx } from "../lib/sfx";
import { speak } from "../lib/speech";
import { bounce, confetti, h, pickOne, reward, shuffle, wait } from "../lib/ui";
import { COLORS } from "./colors";
import type { Game, Scene } from "./types";

const CAR_COLORS = ["red", "blue", "green", "yellow", "orange", "purple", "pink"].map((n) => COLORS.find((c) => c.name === n)!);

export const race: Game = {
  id: "race",
  title: "Race!",
  icon: "🏁",
  color: "#e53935",
  start(scene) {
    pickCar(scene);
  },
};

function pickCar(scene: Scene) {
  const options = shuffle(CAR_COLORS).slice(0, 4);
  scene.root.replaceChildren(
    h(
      "div",
      { class: "race-pick" },
      h("div", { class: "race-title", "aria-hidden": "true" }, "🏁"),
      h(
        "div",
        { class: "choice-grid", style: "--pc:2;--pr:2;--lc:4;--lr:1" },
        ...options.map((c) =>
          h(
            "button",
            {
              class: "choice pop-in",
              "aria-label": `${c.name} race car`,
              onclick: async () => {
                sfx.vroom();
                void speak(`The ${c.name} race car! Vroom!`);
                raceDay(scene, c);
              },
            },
            h("span", { class: "pic art", html: raceCar(c.css) }),
          ),
        ),
      ),
    ),
  );
  void speak("Pick your race car!");
}

function raceDay(scene: Scene, mine: (typeof COLORS)[number]) {
  const rivals = shuffle(CAR_COLORS.filter((c) => c !== mine)).slice(0, 2);
  const racers = [
    { color: mine, me: true, x: 0 },
    { color: rivals[0], me: false, x: 0, speed: 0.07 + Math.random() * 0.02 },
    { color: rivals[1], me: false, x: 0, speed: 0.06 + Math.random() * 0.02 },
  ].sort(() => Math.random() - 0.5) as { color: (typeof COLORS)[number]; me: boolean; x: number; speed?: number }[];

  const lights = h("div", { class: "lights", "aria-hidden": "true" }, h("i", { class: "red" }), h("i", { class: "yellow" }), h("i", { class: "green" }));
  const lanes = racers.map((r) => {
    const car = h("div", { class: `race-car${r.me ? " me" : ""}`, html: raceCar(r.color.css) });
    const lane = h("div", { class: `lane${r.me ? " mine" : ""}` }, car, r.me ? h("div", { class: "you-tag" }, "YOU") : false);
    return { lane, car };
  });
  const track = h("div", { class: "track" }, h("div", { class: "finish", "aria-hidden": "true" }), ...lanes.map((l) => l.lane));
  const go = h("button", { class: "go-btn pedal", disabled: true, "aria-label": "Go! Tap fast!" }, "GO!");
  const status = h("div", { class: "race-status", "aria-live": "polite" });
  scene.root.replaceChildren(h("div", { class: "race-wrap" }, lights, status, track, go));

  let running = false;
  let finished: typeof racers = [];
  let raf = 0;
  let lastT = 0;
  const me = racers.find((r) => r.me)!;

  const STEP = 0.055; // ~18 taps to win

  go.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (!running) return;
    me.x = Math.min(1, me.x + STEP);
    go.classList.remove("press");
    void go.offsetWidth;
    go.classList.add("press");
    if (Math.random() < 0.25) sfx.vroom();
  });

  function frame(t: number) {
    if (!scene.alive()) return;
    const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0;
    lastT = t;
    for (const r of racers) {
      if (!r.me && r.x < 1) {
        // Rubber band: hurry when far behind, ease off when way ahead.
        const gap = r.x - me.x;
        const factor = gap > 0.12 ? 0.35 : gap < -0.15 ? 1.6 : 1;
        r.x = Math.min(1, r.x + (r.speed ?? 0.07) * factor * dt);
      }
      if (r.x >= 1 && !finished.includes(r)) finished.push(r);
    }
    racers.forEach((r, i) => {
      lanes[i].car.style.setProperty("--x", String(r.x));
    });
    if (finished.includes(me)) return void end();
    raf = requestAnimationFrame(frame);
  }

  async function end() {
    running = false;
    go.disabled = true;
    const place = finished.indexOf(me) + 1;
    const words = ["", "first", "second", "third"];
    lanes[racers.indexOf(me)].car.classList.add("winner");
    status.textContent = place === 1 ? "🏆 1st!" : `🥈 ${place === 2 ? "2nd" : "3rd"}!`;
    sfx.fanfare();
    confetti(100);
    void reward(go);
    await speak(place === 1 ? "You won! First place! You get the trophy!" : `You came in ${words[place]} place! Great racing!`);
    if (!scene.alive()) return;
    const again = h("button", { class: "go-btn pop-in", onclick: () => raceDay(scene, mine), "aria-label": "Race again" }, "🏁 Again!");
    const newCar = h("button", { class: "round-btn pop-in", onclick: () => pickCar(scene), "aria-label": "Pick a different car" }, "🏎️");
    go.replaceWith(h("div", { class: "again-row" }, again, newCar));
  }

  scene.signal.addEventListener("abort", () => cancelAnimationFrame(raf));

  void (async () => {
    await wait(600);
    const [red, yellow, green] = Array.from(lights.children);
    for (const [el, word] of [
      [red, "Ready"],
      [yellow, "Set"],
    ] as const) {
      if (!scene.alive()) return;
      el.classList.add("on");
      sfx.beep();
      await speak(`${word}...`, { rate: 1.1 });
      await wait(450);
    }
    if (!scene.alive()) return;
    green.classList.add("on");
    sfx.beep(true);
    go.disabled = false;
    running = true;
    bounce(go);
    void speak(pickOne(["Go go go!", "Go! Tap tap tap!"]), { rate: 1.2 });
    raf = requestAnimationFrame(frame);
  })();
}
