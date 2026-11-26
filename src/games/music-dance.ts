/**
 * Dance party: twenty seconds of music, flashing disco lights and dancing
 * animals. Tap a dancer to hear it and make it spin.
 */
import { byId, type Item } from "../data/items";
import { loadBuffer } from "../lib/audio";
import { speak } from "../lib/speech";
import { confetti, h, icon, pic, shuffle } from "../lib/ui";
import SOUNDS from "../voice/sounds.json";
import { MUSIC_ART } from "./music-art";
import { later, type Kit } from "./music-kit";
import { SCALE_HZ, Ticker, type Drum } from "./music-synth";

export const DANCE_SAY = { go: "Let's dance!" };

const BPM = 120;
const BARS = 10; // 10 bars of 4 beats at 120 BPM = 20 seconds
const DANCERS = ["cow", "duck", "dog", "pig", "trex", "cat", "sheep", "lion", "horse", "frog", "monkey", "elephant", "chicken", "bear", "penguin"];

/** C, A minor, F, G: bass note (Hz) and a little arpeggio on the bars for each. */
const CHORDS: { bass: number; tune: number[] }[] = [
  { bass: 130.81, tune: [0, 2, 4, 2] },
  { bass: 110, tune: [5, 7, 5, 2] },
  { bass: 87.31, tune: [3, 5, 7, 5] },
  { bass: 98, tune: [4, 6, 4, 1] },
];

const LIGHTS = ["#ff5252", "#ffd740", "#69f0ae", "#40c4ff", "#e040fb", "#ff9100"];

export function danceParty(kit: Kit) {
  const { mixer, signal, dbg } = kit;
  const have = new Set(SOUNDS as string[]);
  const items = shuffle(DANCERS.filter((id) => have.has(id)).map((id) => byId.get(id)).filter((i): i is Item => !!i)).slice(0, 5);
  const buffers = new Map<string, AudioBuffer | null>();
  for (const it of items) void loadBuffer(`/sounds/${it.id}.mp3`).then((b) => buffers.set(it.id, b));

  const lights = h("div", { class: "mx-lights", "aria-hidden": "true" }, ...[0, 1, 2, 3].map(() => h("i")));
  const ball = h("div", { class: "mx-ball", "aria-hidden": "true", html: MUSIC_ART.disco });
  const dancers = items.map((it, k) => {
    const d = h("button", { class: "mx-dancer pop-in", style: `animation-delay:${k * 80}ms`, "aria-label": it.name }, h("span", { class: "mx-dancer-in" }, pic(it)));
    d.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      const buf = buffers.get(it.id);
      if (buf && mixer) mixer.sample(buf, 1, undefined, 1.2);
      move(d, "spin");
    });
    return d;
  });
  const floor = h("div", { class: "mx-floor" }, lights, ball, h("div", { class: "mx-dancers", style: `--n:${items.length}` }, ...dancers));

  const fill = h("div", { class: "mx-progress-fill" });
  const progress = h("div", { class: "mx-progress" }, h("span", { class: "mx-progress-pic mx-svg", html: MUSIC_ART.disco }), h("div", { class: "mx-progress-track" }, fill));
  const again = kit.roundBtn(icon("🔁"), "Dance again", () => start(), "mx-again hidden");
  kit.show("mx-dance-screen", [progress, again], floor, kit.home);

  function move(d: HTMLElement, name: string) {
    const inner = d.firstElementChild as HTMLElement;
    inner.classList.remove("hop", "sway-l", "sway-r", "spin", "bow");
    void inner.offsetWidth;
    inner.classList.add(name);
  }

  let ticker: Ticker | null = null;
  const stop = () => {
    ticker?.stop();
    ticker = null;
    floor.classList.remove("party");
    dbg.dancing = false;
  };

  function start() {
    stop();
    again.classList.add("hidden");
    fill.style.transition = "none";
    fill.style.width = "0";
    if (!mixer) return;
    const step = 60 / BPM / 2;
    const total = BARS * 8;
    const t0 = mixer.now + 0.1;
    let n = 0;
    floor.classList.add("party");
    dbg.dancing = true;
    ticker = new Ticker(mixer, (until, t) => {
      while (n <= total && t0 + n * step < until) {
        const at = t0 + n * step;
        const s = n % 8;
        const bar = Math.floor(n / 8);
        const chord = CHORDS[bar % 4];
        if (n === total) {
          // The big finish.
          mixer.drum("crash", at);
          mixer.drum("kick", at);
          for (const b of [0, 2, 4, 7]) mixer.note("piano", SCALE_HZ[b], at, 0.6);
          mixer.bass(130.81, at, 1, 0.8);
          t.show(at, finish);
          n++;
          return true;
        }
        const hits: [Drum, number][] = [];
        if (s % 2 === 0) hits.push(["kick", 1]);
        else hits.push(["hat", 0.5]);
        if (s === 2 || s === 6) hits.push(["clap", 0.7]);
        if (s === 0 && bar % 4 === 0) hits.push(["crash", 0.6]);
        for (const [d, v] of hits) mixer.drum(d, at, v);
        if (s === 0 || s === 3 || s === 4 || s === 6) mixer.bass(s === 4 ? chord.bass * 2 : chord.bass, at, s === 0 ? 1 : 0.75);
        if (bar >= 2 && s % 2 === 0) mixer.note("musicbox", SCALE_HZ[chord.tune[s / 2]], at, 0.45);
        if (s % 2 === 0) {
          const beat = n / 2;
          t.show(at, () => onBeat(beat, s === 0 ? bar : -1));
        }
        n++;
      }
    });
  }

  function onBeat(beat: number, barStart: number) {
    fill.style.transition = "";
    fill.style.width = `${Math.min(100, (beat / (BARS * 4)) * 100)}%`;
    const spots = [...lights.children] as HTMLElement[];
    spots.forEach((sp, k) => {
      sp.style.background = `radial-gradient(circle, ${LIGHTS[(beat + k * 2) % LIGHTS.length]} 0, transparent 65%)`;
      sp.style.opacity = (beat + k) % 2 ? "0.9" : "0.45";
    });
    dancers.forEach((d, k) => {
      if (barStart >= 0 && k === barStart % dancers.length) return move(d, "spin");
      move(d, (beat + k) % 2 ? "hop" : beat % 4 < 2 ? "sway-l" : "sway-r");
    });
    dbg.danceBeat = beat;
  }

  function finish() {
    stop();
    dancers.forEach((d) => move(d, "bow"));
    confetti(60);
    again.classList.remove("hidden");
    fill.style.width = "100%";
  }

  signal.addEventListener("abort", stop);
  void speak(DANCE_SAY.go);
  later(signal, 700, start);
}
