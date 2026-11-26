/**
 * Drums: six big pads and a ▶ beat to play along with.
 */
import { h } from "../lib/ui";
import { MUSIC_ART, type MusicArt } from "./music-art";
import { Ticker, type Drum, type Mixer } from "./music-synth";

const PADS: { kind: Drum; art: MusicArt; color: string }[] = [
  { kind: "kick", art: "kick", color: "#42a5f5" },
  { kind: "snare", art: "drum", color: "#ef5350" },
  { kind: "hat", art: "hat", color: "#ffca28" },
  { kind: "tom", art: "tom", color: "#66bb6a" },
  { kind: "clap", art: "clap", color: "#ff8a65" },
  { kind: "crash", art: "crash", color: "#ab47bc" },
];

export const BEAT_BPM = 100;

/** One bar of eighth notes: [drum, velocity] per step. */
export const GROOVE: [Drum, number][][] = [
  [["kick", 1], ["hat", 0.7]],
  [["hat", 0.4]],
  [["snare", 0.9], ["hat", 0.7]],
  [["hat", 0.4]],
  [["kick", 1], ["hat", 0.7]],
  [["kick", 0.8], ["hat", 0.4]],
  [["snare", 0.9], ["hat", 0.7]],
  [["hat", 0.4]],
];

export interface DrumsUI {
  pads: HTMLElement;
  toggle: HTMLButtonElement;
  /** For tests: is the beat running? */
  isBeating(): boolean;
}

export function drums(mixer: Mixer | null, signal: AbortSignal): DrumsUI {
  const padEls = new Map<Drum, HTMLElement>();
  const flash = (kind: Drum, soft = false) => {
    const p = padEls.get(kind);
    if (!p) return;
    const cls = soft ? "beat" : "hit";
    p.classList.remove("hit", "beat");
    void p.offsetWidth;
    p.classList.add(cls);
  };

  const pads = h(
    "div",
    { class: "mx-pads" },
    ...PADS.map((pd, i) => {
      const el = h("button", { class: "mx-pad pop-in", style: `--c:${pd.color}; animation-delay:${i * 50}ms`, "aria-label": pd.kind, html: MUSIC_ART[pd.art] });
      el.addEventListener(
        "pointerdown",
        (e) => {
          e.preventDefault();
          mixer?.drum(pd.kind);
          flash(pd.kind);
        },
        { signal },
      );
      el.addEventListener("contextmenu", (e) => e.preventDefault(), { signal });
      padEls.set(pd.kind, el);
      return el;
    }),
  );

  const toggle = h("button", { class: "mx-beat-btn", "aria-label": "Beat", html: MUSIC_ART.play });

  let ticker: Ticker | null = null;
  const stopBeat = () => {
    ticker?.stop();
    ticker = null;
    toggle.classList.remove("on");
    toggle.innerHTML = MUSIC_ART.play;
  };
  const startBeat = () => {
    if (!mixer) return;
    const step = 60 / BEAT_BPM / 2;
    let n = 0;
    let next = mixer.now + 0.05;
    ticker = new Ticker(mixer, (until, t) => {
      // Fell behind (tab in the background)? Skip ahead rather than burst.
      if (next < mixer.now - 0.05) next = mixer.now + 0.05;
      while (next < until) {
        const at = next;
        const s = n % 8;
        const barNo = Math.floor(n / 8) % 4;
        const hits: [Drum, number][] = [...GROOVE[s]];
        if (n === 0) hits.push(["crash", 0.8]);
        // A little tom fill at the end of every fourth bar.
        if (barNo === 3 && s >= 6) hits.push(["tom", 0.8]);
        for (const [d, v] of hits) mixer.drum(d, at, v);
        t.show(at, () => {
          for (const [d] of hits) if (d !== "hat") flash(d, true);
          if (s % 2 === 0) {
            toggle.classList.remove("tick");
            void toggle.offsetWidth;
            toggle.classList.add("tick");
          }
        });
        n++;
        next += step;
      }
    });
    toggle.classList.add("on");
    toggle.innerHTML = MUSIC_ART.pause;
  };
  toggle.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (ticker) stopBeat();
    else startBeat();
  }, { signal });
  signal.addEventListener("abort", stopBeat);

  return { pads, toggle, isBeating: () => !!ticker };
}
