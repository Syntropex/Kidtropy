/**
 * Music: a rainbow xylophone (or piano, music box, steel drum), a drum kit
 * with a beat to play along with, an animal piano (the cow goes moo in eight
 * different notes!), "follow the lights" songs, a parrot that echoes what you
 * say in funny voices, a beat maker and a dance party.
 *
 * Everything is synthesized with Web Audio except the animal piano, which
 * pitches the real recordings in public/sounds/. Music plays even when the
 * grown-up has turned sound effects off.
 */
import "./music.css";
import { byId, type Item } from "../data/items";
import { loadBuffer } from "../lib/audio";
import { speak } from "../lib/speech";
import { bounce, h, icon, pic, reward } from "../lib/ui";
import { line } from "../voice/lines";
import SOUNDS from "../voice/sounds.json";
import { MUSIC_ART, type MusicArt } from "./music-art";
import { makeBars } from "./music-bars";
import { danceParty, DANCE_SAY } from "./music-dance";
import { drums } from "./music-drums";
import { beatMaker, GRID_SAY } from "./music-grid";
import type { Kit } from "./music-kit";
import { parrot, PARROT_SAY } from "./music-parrot";
import { noteTimes, SONGS, songLength, type Song } from "./music-songs";
import { INSTRUMENTS, makeMixer, SCALE_HZ, SCALE_SEMIS, Ticker, type Instrument } from "./music-synth";
import type { Game } from "./types";

const SAY = {
  intro: "Let's make music!",
  whoSings: "Who should sing?",
  pickSong: "Pick a song!",
  tapGlow: "Tap the glowing bar!",
  songDone: "You played the song!",
};

/** Short, clear sounds first; anything else in sounds.json comes after. */
const SINGER_ORDER = ["duck", "cow", "dog", "cat", "pig", "sheep", "horse", "car", "lion", "frog", "trex", "firetruck", "chicken", "elephant", "rooster", "turkey", "goat", "tiger", "train", "tractor", "bus", "rocket"];
/** Recorded sounds that aren't much of a singing voice (crunchy food, prizes). */
const NOT_SINGERS = new Set(["apple", "carrot", "corn", "egg", "medal", "trophy", "builder", "tire"]);
const PAGE = 12;
const SONG_PAGE = 6;

/** The bars' sound, shared by the xylophone and songs (kept while the app is open). */
let instrument: Instrument = "xylophone";
const INSTRUMENT_ART: Record<Instrument, MusicArt> = { xylophone: "xylophone", piano: "piano", musicbox: "musicbox", steeldrum: "steeldrum" };

/** The animals and vehicles that can sing on the animal piano. */
export function singers(): Item[] {
  const ids = (SOUNDS as string[]).filter((id) => !NOT_SINGERS.has(id));
  const ordered = [...SINGER_ORDER.filter((id) => ids.includes(id)), ...ids.filter((id) => !SINGER_ORDER.includes(id))];
  return ordered.map((id) => byId.get(id)).filter((i): i is Item => !!i && !!i.sound);
}

/** Playback rate for each bar: a major scale with the recording's own pitch on the 4th bar. */
const rateFor = (i: number) => Math.pow(2, (SCALE_SEMIS[i] - 5) / 12);

function songPicture(s: Song, cls = ""): HTMLElement {
  const { item: id, emoji, art } = s.picture;
  const item = id ? byId.get(id) : undefined;
  const c = `${cls} ${s.picture.cls ?? ""}`;
  if (item) return pic(item, c);
  if (art && art in MUSIC_ART) return h("span", { class: `pic art ${c}`, html: MUSIC_ART[art as MusicArt] });
  return h("span", { class: `pic art ${c}` }, icon(emoji ?? "🎵"));
}

/** For tests and debugging in dev: what the game is doing right now. */
const dbg: Record<string, unknown> = {};

export const music: Game = {
  id: "music",
  title: "Music",
  icon: "🎵",
  color: "#5c6bc0",
  start(scene) {
    const mixer = makeMixer();
    const wrap = h("div", { class: "mx" });
    scene.root.replaceChildren(wrap);
    if (import.meta.env.DEV) Object.assign(window, { __music: Object.assign(dbg, { mixer, mode: "picker" }) });

    let ctl: AbortController | null = null;
    scene.signal.addEventListener("abort", () => {
      ctl?.abort();
      mixer?.close();
      dbg.mode = "gone";
    });

    /** Start a new screen: everything from the last one stops. */
    const fresh = (mode: string) => {
      ctl?.abort();
      ctl = new AbortController();
      dbg.mode = mode;
      return ctl.signal;
    };

    const roundBtn = (child: Node, label: string, onTap: () => void, cls = "") => {
      const b = h("button", { class: `mx-round ${cls}`, "aria-label": label }, child);
      b.addEventListener("click", onTap);
      return b;
    };

    const show = (cls: string, top: Node[] | null, body: Node, back?: () => void) => {
      const bar = top ? h("div", { class: "mx-top" }, back ? roundBtn(icon("⬅️"), "Back", back, "mx-back") : null, ...top) : null;
      const stage = h("div", { class: `mx-stage ${cls}` }, body);
      if (bar) wrap.replaceChildren(bar, stage);
      else wrap.replaceChildren(stage);
    };
    const spacer = () => h("span", { class: "mx-spacer" });

    const arpeggio = (bars = [0, 2, 4, 7], gap = 0.09, inst: Instrument = "xylophone") => {
      if (!mixer) return;
      bars.forEach((b, k) => mixer.note(inst, SCALE_HZ[b], mixer.now + k * gap, 0.8));
    };

    /** Everything a screen in its own file needs. */
    const kitFor = (mode: string): Kit => ({ mixer, signal: fresh(mode), show, roundBtn, spacer, home: picker, dbg });

    // ---- Mode picker -------------------------------------------------------

    function picker() {
      fresh("picker");
      const keysStrip = h("span", { class: "mx-mini-keys" }, ...[0, 1, 2, 3, 4, 5, 6, 7].map(() => h("i")));
      const modes: { label: string; color: string; content: Node[]; preview: () => void; go: () => void }[] = [
        { label: "Xylophone", color: "#ff7043", content: [h("span", { class: "mx-mode-art", html: MUSIC_ART.xylophone })], preview: () => arpeggio(), go: xylophone },
        { label: "Drums", color: "#42a5f5", content: [h("span", { class: "mx-mode-art", html: MUSIC_ART.drum })], preview: () => mixer?.drum("snare"), go: drumKit },
        {
          label: "Animal piano",
          color: "#66bb6a",
          content: [pic(byId.get("cow") ?? singers()[0], "mx-mode-pic"), keysStrip],
          preview: () => arpeggio([4, 2, 0], 0.08),
          go: () => animalPick(0, true),
        },
        { label: "Songs", color: "#ab47bc", content: [h("span", { class: "mx-mode-art", html: MUSIC_ART.songs })], preview: () => arpeggio([0, 0, 4, 4, 5, 5, 4], 0.12), go: () => songPick(0, true) },
        { label: "Parrot", color: "#26a69a", content: [h("span", { class: "mx-mode-art", html: MUSIC_ART.parrot })], preview: () => {}, go: () => parrot(kitFor("parrot")) },
        { label: "Beat maker", color: "#5c6bc0", content: [h("span", { class: "mx-mode-art", html: MUSIC_ART.grid })], preview: () => mixer?.drum("kick"), go: () => beatMaker(kitFor("grid")) },
        { label: "Dance party", color: "#ec407a", content: [h("span", { class: "mx-mode-art", html: MUSIC_ART.disco })], preview: () => {}, go: () => danceParty(kitFor("dance")) },
      ];
      show(
        "mx-picker",
        null,
        h(
          "div",
          { class: "mx-modes" },
          ...modes.map((m, i) => {
            const b = h("button", { class: "mx-mode pop-in", style: `--c:${m.color}; animation-delay:${i * 60}ms`, "aria-label": m.label }, ...m.content);
            b.addEventListener("click", () => {
              m.preview();
              m.go();
            });
            return b;
          }),
        ),
      );
    }

    // ---- Xylophone -----------------------------------------------------------

    function xylophone() {
      const signal = fresh("xylophone");
      const bars = makeBars(signal, (i, at) => {
        mixer?.note(instrument, SCALE_HZ[i]);
        bars.hit(i, at);
      });
      const choices = INSTRUMENTS.map((inst) => {
        const b = roundBtn(h("span", { class: "mx-svg", html: MUSIC_ART[INSTRUMENT_ART[inst]] }), inst, () => {
          instrument = inst;
          dbg.instrument = inst;
          choices.forEach((c, k) => c.classList.toggle("on", INSTRUMENTS[k] === inst));
          bars.el.dataset.inst = inst;
          bounce(b);
          arpeggio([0, 2, 4, 7], 0.1, inst);
        }, `mx-inst${inst === instrument ? " on" : ""}`);
        return b;
      });
      bars.el.dataset.inst = instrument;
      dbg.instrument = instrument;
      show("mx-xylo", [spacer(), ...choices], bars.el, picker);
    }

    // ---- Drums -----------------------------------------------------------------

    function drumKit() {
      const signal = fresh("drums");
      const kit = drums(mixer, signal);
      dbg.isBeating = kit.isBeating;
      show("mx-drums", [spacer(), kit.toggle, spacer(), h("span", { class: "mx-round-gap" })], kit.pads, picker);
    }

    // ---- Animal piano ------------------------------------------------------------

    function animalPick(page: number, say = false) {
      fresh("animals");
      const all = singers();
      const pages = Math.max(1, Math.ceil(all.length / PAGE));
      page %= pages;
      const items = all.slice(page * PAGE, page * PAGE + PAGE);
      for (const it of items) void loadBuffer(`/sounds/${it.id}.mp3`);
      const grid = h(
        "div",
        { class: "mx-grid mx-singers", style: `--n:${items.length}` },
        ...items.map((it, i) => {
          const b = h("button", { class: "mx-tile pop-in", style: `animation-delay:${i * 35}ms`, "aria-label": it.name }, pic(it));
          b.addEventListener("click", () => animalPiano(it, page));
          return b;
        }),
      );
      const more = pages > 1 ? roundBtn(icon("🔄"), "More", () => animalPick(page + 1)) : h("span", { class: "mx-round-gap" });
      show("mx-pick", [spacer(), more], grid, picker);
      if (say) void speak(SAY.whoSings);
    }

    function animalPiano(item: Item, page: number) {
      const signal = fresh("piano");
      let buf: AudioBuffer | null = null;
      let tapped = false;
      void loadBuffer(`/sounds/${item.id}.mp3`).then((b) => (buf = b));
      const playing: { i: number; stop: () => void }[] = [];
      const singer = h("div", { class: "mx-singer pop-in" }, pic(item));
      const bars = makeBars(
        signal,
        (i, at) => {
          tapped = true;
          bars.hit(i, at);
          bounce(singer);
          if (!mixer) return;
          if (!buf) return mixer.mallet(SCALE_HZ[i]);
          // Re-tapping a key restarts it; keep at most six voices.
          for (let k = playing.length - 1; k >= 0; k--) {
            if (playing[k].i === i || playing.length > 5) {
              playing[k].stop();
              playing.splice(k, 1);
            }
          }
          playing.push({ i, stop: mixer.sample(buf, rateFor(i)) });
        },
        (bar) => bar.append(pic(item, "mx-key-pic")),
      );
      show("mx-animal", [spacer(), singer, spacer(), h("span", { class: "mx-round-gap" })], bars.el, () => animalPick(page));
      void speak(line.name(item)).then(() => {
        if (!signal.aborted && !tapped && buf && mixer) {
          bounce(singer);
          mixer.sample(buf, 1);
        }
      });
    }

    // ---- Songs ---------------------------------------------------------------------

    let toldGlow = false;

    function songPick(page = 0, say = false) {
      fresh("songs");
      const pages = Math.ceil(SONGS.length / SONG_PAGE);
      page = ((page % pages) + pages) % pages;
      const songs = SONGS.slice(page * SONG_PAGE, page * SONG_PAGE + SONG_PAGE);
      const grid = h(
        "div",
        { class: "mx-grid mx-songs", style: `--n:${songs.length}` },
        ...songs.map((s, i) => {
          const b = h("button", { class: "mx-tile pop-in", style: `animation-delay:${i * 50}ms`, "aria-label": s.title }, songPicture(s), h("span", { class: "mx-badge", html: MUSIC_ART.songs }));
          b.addEventListener("click", () => songPlay(s, page));
          return b;
        }),
      );
      const dots = h("span", { class: "mx-dots", "aria-hidden": "true" }, ...Array.from({ length: pages }, (_, k) => h("i", { class: k === page ? "on" : "" })));
      const more = roundBtn(icon("🔄"), "More songs", () => songPick(page + 1));
      show("mx-pick", [spacer(), dots, spacer(), more], grid, picker);
      dbg.songPage = page;
      if (say) void speak(SAY.pickSong);
    }

    function songPlay(song: Song, page = 0) {
      const signal = fresh("song");
      let step = 0;
      let done = false;
      let listening: Ticker | null = null;
      let lastTap = performance.now();

      const fill = h("div", { class: "mx-progress-fill" });
      const progress = h("div", { class: "mx-progress" }, songPicture(song, "mx-progress-pic"), h("div", { class: "mx-progress-track" }, fill));
      const listenBtn = roundBtn(icon("👂"), "Listen", () => (listening ? stopListening() : listen()), "mx-listen");
      const againBtn = roundBtn(icon("🔁"), "Again", () => restart(), "mx-again hidden");

      const bars = makeBars(signal, (i, at) => {
        mixer?.note(instrument, SCALE_HZ[i]);
        bars.hit(i, at);
        lastTap = performance.now();
        if (listening) stopListening();
        if (done) return;
        if (i === song.notes[step].bar) {
          step++;
          dbg.step = step;
          if (step >= song.notes.length) finish();
          else update();
        }
      });

      function update() {
        bars.glow(done || listening ? null : song.notes[step].bar);
        fill.style.width = `${(step / song.notes.length) * 100}%`;
      }

      function listen() {
        if (!mixer) return;
        stopListening();
        const times = noteTimes(song);
        const start = mixer.now + 0.15;
        let k = 0;
        listening = new Ticker(mixer, (until, t) => {
          while (k < times.length && start + times[k] < until) {
            const n = song.notes[k];
            const at = start + times[k];
            mixer.note(instrument, SCALE_HZ[n.bar], at);
            t.show(at, () => bars.hit(n.bar));
            k++;
          }
          if (k >= times.length) {
            t.show(start + songLength(song), stopListening);
            return true;
          }
        });
        dbg.listening = true;
        listenBtn.classList.add("on");
        listenBtn.replaceChildren(h("span", { class: "mx-svg", html: MUSIC_ART.stop }));
        update();
      }

      function stopListening() {
        if (!listening) return;
        listening.stop();
        listening = null;
        dbg.listening = false;
        listenBtn.classList.remove("on");
        listenBtn.replaceChildren(icon("👂"));
        update();
      }

      function finish() {
        done = true;
        update();
        againBtn.classList.remove("hidden");
        // A rainbow run up the bars, then hooray.
        if (mixer) {
          [0, 2, 4, 7].forEach((b, k) => mixer.note(instrument, SCALE_HZ[b], mixer.now + 0.25 + k * 0.1, 0.8));
          mixer.note(instrument, SCALE_HZ[0], mixer.now + 0.65, 0.6);
          mixer.note(instrument, SCALE_HZ[4], mixer.now + 0.65, 0.6);
        }
        bars.bars.forEach((_, k) =>
          setTimeout(() => {
            if (!signal.aborted) bars.hit(k);
          }, 250 + k * 70),
        );
        setTimeout(() => {
          if (signal.aborted) return;
          void reward(progress);
          void speak(SAY.songDone);
        }, 900);
      }

      function restart() {
        step = 0;
        done = false;
        dbg.step = 0;
        againBtn.classList.add("hidden");
        update();
      }

      // A gentle nudge when the child hasn't tapped for a while.
      const idle = setInterval(() => {
        if (done || listening || performance.now() - lastTap < 6000) return;
        lastTap = performance.now();
        bars.nudge(song.notes[step].bar);
      }, 1000);
      signal.addEventListener("abort", () => {
        clearInterval(idle);
        stopListening();
      });

      bars.el.dataset.inst = instrument;
      show("mx-song", [progress, againBtn, listenBtn], bars.el, () => songPick(page));
      update();
      dbg.step = 0;
      dbg.song = song.id;
      dbg.listen = listen;
      const first = !toldGlow;
      toldGlow = true;
      void speak(first ? `${song.title} ${SAY.tapGlow}` : song.title);
    }

    picker();
    void speak(SAY.intro);
  },
  lines: () => [
    ...Object.values(SAY),
    ...Object.values(PARROT_SAY),
    ...Object.values(GRID_SAY),
    ...Object.values(DANCE_SAY),
    ...SONGS.map((s) => s.title),
    ...singers().map((i) => line.name(i)),
  ],
};
