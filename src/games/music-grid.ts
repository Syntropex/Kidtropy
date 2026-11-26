/**
 * Beat maker: a loop of 8 steps for 5 sounds (kick, snare, hi-hat, clap and
 * an animal). Tap or swipe squares on and off; it loops at 100 BPM on the
 * audio clock with a moving playhead.
 */
import { byId, type Item } from "../data/items";
import { loadBuffer } from "../lib/audio";
import { speak } from "../lib/speech";
import { bounce, h, icon, pic } from "../lib/ui";
import SOUNDS from "../voice/sounds.json";
import { MUSIC_ART, type MusicArt } from "./music-art";
import type { Kit } from "./music-kit";
import { Ticker, type Drum } from "./music-synth";

export const GRID_SAY = { intro: "Tap the squares to make a beat!" };

export const STEPS = 8;
const BPM = 100;

interface Row {
  color: string;
  drum?: Drum;
  art?: MusicArt;
}

const ROWS: Row[] = [
  { drum: "kick", art: "kick", color: "#42a5f5" },
  { drum: "snare", art: "drum", color: "#ef5350" },
  { drum: "hat", art: "hat", color: "#ffca28" },
  { drum: "clap", art: "clap", color: "#ff8a65" },
  { color: "#66bb6a" }, // the animal row
];

/** Grooves for the dice button: one string per row, x = on. */
export const PRESETS = [
  ["x...xx..", "..x...x.", "xxxxxxxx", "........", ".......x"],
  ["x.x.x.x.", "........", ".x.x.x.x", "..x...x.", "x......."],
  ["x..x..x.", "....x...", "x.x.x.x.", "..x....x", "..x..x.."],
  ["x...x...", "..x...x.", "x.xxx.xx", "......xx", "....x..."],
];

const ANIMALS = ["duck", "cow", "dog", "cat", "pig", "sheep", "chicken", "frog"];

export function beatMaker(kit: Kit) {
  const { mixer, signal, dbg } = kit;
  const animals = ANIMALS.filter((id) => (SOUNDS as string[]).includes(id))
    .map((id) => byId.get(id))
    .filter((i): i is Item => !!i);
  let animal = 0;
  const buffers = new Map<string, AudioBuffer | null>();
  for (const a of animals) void loadBuffer(`/sounds/${a.id}.mp3`).then((b) => buffers.set(a.id, b));

  const on: boolean[][] = ROWS.map(() => Array(STEPS).fill(false));
  let preset = 0;
  const load = (p: string[]) => p.forEach((row, r) => [...row].forEach((c, s) => (on[r][s] = c === "x")));
  load(PRESETS[0]);

  const playRow = (r: number, at?: number, vel = 1) => {
    if (!mixer) return;
    const row = ROWS[r];
    if (row.drum) return mixer.drum(row.drum, at, vel);
    const a = animals[animal];
    const buf = a && buffers.get(a.id);
    if (buf) mixer.sample(buf, 1, at, 0.45);
    else mixer.note("xylophone", 523.25, at, vel);
  };

  // ---- The grid --------------------------------------------------------------
  const grid = h("div", { class: "mx-seq", style: `--steps:${STEPS}; --rows:${ROWS.length}` });
  const cells: HTMLElement[][] = [];
  const animalHead = h("button", { class: "mx-seq-head mx-seq-animal", "aria-label": "Animal" });
  const showAnimal = () => {
    const a = animals[animal];
    animalHead.replaceChildren(a ? pic(a) : icon("🦆"));
  };
  ROWS.forEach((row, r) => {
    const head =
      row.drum && row.art
        ? h("button", { class: "mx-seq-head", "aria-label": row.drum, html: MUSIC_ART[row.art] })
        : animalHead;
    head.style.cssText = `--c:${row.color}; --pr:1; --pc:${r + 1}; --lr:${r + 1}; --lc:1`;
    head.addEventListener("click", () => {
      if (!row.drum && animals.length) {
        animal = (animal + 1) % animals.length;
        showAnimal();
      }
      bounce(head);
      playRow(r);
    });
    grid.append(head);
    cells[r] = [];
    for (let s = 0; s < STEPS; s++) {
      const c = h("div", {
        class: `mx-cell${Math.floor(s / 2) % 2 ? " alt" : ""}`,
        role: "button",
        "aria-label": `Step ${s + 1}`,
        "data-r": String(r),
        "data-s": String(s),
        style: `--c:${row.color}; --pr:${s + 2}; --pc:${r + 1}; --lr:${r + 1}; --lc:${s + 2}`,
      });
      cells[r][s] = c;
      grid.append(c);
    }
  });
  showAnimal();
  const paint = () => ROWS.forEach((_, r) => cells[r].forEach((c, s) => c.classList.toggle("on", on[r][s])));
  paint();

  // Tap to toggle; keep the finger down and swipe to paint more.
  const painting = new Map<number, { value: boolean; last: HTMLElement | null }>();
  const cellAt = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>(".mx-cell");
    return el && grid.contains(el) ? el : null;
  };
  const setCell = (el: HTMLElement, value: boolean) => {
    const r = Number(el.dataset.r);
    const s = Number(el.dataset.s);
    if (on[r][s] === value) return;
    on[r][s] = value;
    el.classList.toggle("on", value);
    if (value) {
      playRow(r, undefined, 0.8);
      bounce(el);
    }
    dbg.grid = on.map((row) => row.map((v) => (v ? "x" : ".")).join(""));
  };
  grid.addEventListener(
    "pointerdown",
    (e) => {
      const el = cellAt(e.clientX, e.clientY);
      if (!el) return;
      e.preventDefault();
      try {
        (e.target as Element).releasePointerCapture?.(e.pointerId);
      } catch {
        /* fine */
      }
      const value = !el.classList.contains("on");
      painting.set(e.pointerId, { value, last: el });
      setCell(el, value);
    },
    { signal },
  );
  grid.addEventListener(
    "pointermove",
    (e) => {
      const p = painting.get(e.pointerId);
      if (!p) return;
      const el = cellAt(e.clientX, e.clientY);
      if (!el || el === p.last) return;
      p.last = el;
      setCell(el, p.value);
    },
    { signal },
  );
  for (const type of ["pointerup", "pointercancel"]) window.addEventListener(type, (e) => painting.delete((e as PointerEvent).pointerId), { signal });
  grid.addEventListener("contextmenu", (e) => e.preventDefault(), { signal });

  // ---- The loop ----------------------------------------------------------------
  const toggle = h("button", { class: "mx-beat-btn pulse-me", "aria-label": "Play", html: MUSIC_ART.play });
  let ticker: Ticker | null = null;
  const setNow = (s: number) => cells.forEach((row) => row.forEach((c, k) => c.classList.toggle("now", k === s)));
  const stop = () => {
    ticker?.stop();
    ticker = null;
    setNow(-1);
    toggle.classList.remove("on");
    toggle.innerHTML = MUSIC_ART.play;
    dbg.gridPlaying = false;
  };
  const start = () => {
    if (!mixer) return;
    const step = 60 / BPM / 2;
    let n = 0;
    let next = mixer.now + 0.05;
    ticker = new Ticker(mixer, (until, t) => {
      if (next < mixer.now - 0.05) next = mixer.now + 0.05;
      while (next < until) {
        const s = n % STEPS;
        const at = next;
        ROWS.forEach((_, r) => {
          if (on[r][s]) playRow(r, at, s % 2 ? 0.7 : 1);
        });
        t.show(at, () => {
          setNow(s);
          dbg.gridStep = s;
        });
        n++;
        next += step;
      }
    });
    toggle.classList.remove("pulse-me");
    toggle.classList.add("on");
    toggle.innerHTML = MUSIC_ART.pause;
    dbg.gridPlaying = true;
  };
  toggle.addEventListener(
    "pointerdown",
    (e) => {
      e.preventDefault();
      if (ticker) stop();
      else start();
    },
    { signal },
  );
  signal.addEventListener("abort", stop);

  const dice = kit.roundBtn(icon("🎲"), "New beat", () => {
    preset = (preset + 1) % PRESETS.length;
    load(PRESETS[preset]);
    paint();
    bounce(dice);
    if (!ticker) start();
    dbg.grid = on.map((row) => row.map((v) => (v ? "x" : ".")).join(""));
  });
  const clear = kit.roundBtn(h("span", { class: "mx-svg", html: MUSIC_ART.clear }), "Clear", () => {
    on.forEach((row) => row.fill(false));
    paint();
    bounce(clear);
    dbg.grid = on.map((row) => row.map((v) => (v ? "x" : ".")).join(""));
  });

  kit.show("mx-grid-screen", [kit.spacer(), toggle, kit.spacer(), dice, clear], grid, kit.home);
  dbg.isGridPlaying = () => !!ticker;
  void speak(GRID_SAY.intro);
}
