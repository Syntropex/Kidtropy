/**
 * Parrot echo: say something and the parrot says it back, in a parrot voice,
 * a squeaky mouse voice, a giant elephant voice or a robot voice.
 *
 * The recording lives only in memory while this screen is open. Nothing is
 * stored or uploaded, and the microphone is switched off the moment the
 * recording ends (on iPhone that also gives the speaker back its full volume).
 */
import { byId } from "../data/items";
import { speak, stopSpeaking } from "../lib/speech";
import { bounce, h, icon, pic } from "../lib/ui";
import { MUSIC_ART } from "./music-art";
import { later, type Kit } from "./music-kit";

export const PARROT_SAY = {
  intro: "Tap the button and talk to me!",
  micOff: "Uh oh! The microphone is off.",
};

const MAX_SECONDS = 3;

type Result = AudioBuffer | "denied" | "unsupported" | "empty";

export interface Recording {
  done: Promise<Result>;
  /** Finish early (keeps what was recorded so far). */
  stop(): void;
}

/** Record up to `maxSec` seconds from the microphone into an AudioBuffer. */
export function startRecording(ctx: AudioContext, maxSec: number, signal: AbortSignal, onLevel: (rms: number) => void): Recording {
  let finish: () => void = () => {};
  let stopped = false;
  const stop = () => {
    stopped = true;
    finish();
  };
  const done = (async (): Promise<Result> => {
    const md = navigator.mediaDevices;
    if (!md?.getUserMedia) return "unsupported";
    let stream: MediaStream;
    try {
      stream = await md.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    } catch (e) {
      const name = (e as DOMException)?.name;
      return name === "NotFoundError" || name === "NotSupportedError" ? "unsupported" : "denied";
    }
    const stopTracks = () => stream.getTracks().forEach((t) => t.stop());
    if (signal.aborted) {
      stopTracks();
      return "empty";
    }
    if (ctx.state === "suspended") void ctx.resume();
    const chunks: Float32Array[] = [];
    const src = ctx.createMediaStreamSource(stream);
    // ScriptProcessor is old but works everywhere (including iOS Safari)
    // without loading a worklet module.
    const proc = ctx.createScriptProcessor(2048, 1, 1);
    const mute = ctx.createGain();
    mute.gain.value = 0;
    proc.onaudioprocess = (e) => {
      const d = e.inputBuffer.getChannelData(0);
      chunks.push(new Float32Array(d));
      let sum = 0;
      for (let i = 0; i < d.length; i += 4) sum += d[i] * d[i];
      onLevel(Math.sqrt(sum / (d.length / 4)));
    };
    src.connect(proc);
    proc.connect(mute).connect(ctx.destination);
    await new Promise<void>((resolve) => {
      if (stopped || signal.aborted) return resolve();
      finish = resolve;
      const t = setTimeout(resolve, maxSec * 1000);
      signal.addEventListener("abort", () => {
        clearTimeout(t);
        resolve();
      });
    });
    proc.onaudioprocess = null;
    src.disconnect();
    proc.disconnect();
    mute.disconnect();
    stopTracks();
    const len = chunks.reduce((n, c) => n + c.length, 0);
    if (!len) return "empty";
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    let o = 0;
    for (const c of chunks) {
      ch.set(c, o);
      o += c.length;
    }
    return buf;
  })();
  return { done, stop };
}

interface Voice {
  id: string;
  face: () => Node;
  rate: number;
  robot?: boolean;
}

export function parrot(kit: Kit) {
  const { mixer, signal, dbg } = kit;
  let clip: AudioBuffer | null = null;
  let rec: Recording | null = null;
  let stopVoice: (() => void) | null = null;

  const elephant = byId.get("elephant");
  const VOICES: Voice[] = [
    { id: "parrot", face: () => h("span", { class: "mx-svg", html: MUSIC_ART.parrot }), rate: 1.3 },
    { id: "mouse", face: () => icon("🐭"), rate: 1.8 },
    { id: "giant", face: () => (elephant ? pic(elephant) : icon("🐘")), rate: 0.62 },
    { id: "robot", face: () => icon("🤖"), rate: 1, robot: true },
  ];

  const bird = h("button", { class: "mx-parrot", "aria-label": "Parrot", html: MUSIC_ART.parrot });
  const ring = h("span", {
    class: "mx-rec-ring",
    html: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" pathLength="100"/></svg>`,
  });
  const micOff = h("span", { class: "mx-mic-off hidden" }, icon("❌"));
  const mic = h("button", { class: "mx-mic", "aria-label": "Talk" }, icon("🎤"), ring, micOff);
  const voiceBtns = VOICES.slice(1).map((v) => {
    const b = h("button", { class: `mx-voice pop-in`, "aria-label": `${v.id} voice` }, v.face());
    b.addEventListener("click", () => {
      bounce(b);
      play(v, b);
    });
    return b;
  });
  const voices = h("div", { class: "mx-voices hidden" }, ...voiceBtns);
  const note = h(
    "p",
    { class: "grownup-note mx-mic-note hidden" },
    "Grown-ups: the parrot needs the microphone. Allow it for this site in the browser's settings, then tap the microphone again. What your child says stays in this page for a moment and is never saved or sent anywhere.",
  );

  const body = h("div", { class: "mx-parrot-stage" }, h("div", { class: "mx-parrot-perch" }, bird), h("div", { class: "mx-parrot-controls" }, mic, voices), note);
  kit.show("mx-parrot-screen", [kit.spacer()], body, kit.home);
  void speak(PARROT_SAY.intro);

  function setTalking(el: HTMLElement, secs: number) {
    el.classList.add("talking");
    later(signal, secs * 1000, () => el.classList.remove("talking"));
  }

  function play(v: Voice, btn?: HTMLElement) {
    if (!clip || !mixer) return;
    stopVoice?.();
    const r = mixer.voice(clip, { rate: v.rate, robot: v.robot, maxDur: MAX_SECONDS * 2 + 1 });
    stopVoice = r.stop;
    dbg.lastVoice = v.id;
    setTalking(btn ?? bird, r.dur);
  }

  async function record() {
    if (!mixer) return showMicOff();
    stopSpeaking();
    stopVoice?.();
    mic.classList.add("rec");
    bird.classList.add("listening");
    micOff.classList.add("hidden");
    dbg.recording = true;
    rec = startRecording(mixer.ctx, MAX_SECONDS, signal, (lvl) => {
      mic.style.setProperty("--lvl", String(Math.min(1, lvl * 8)));
    });
    const res = await rec.done;
    rec = null;
    dbg.recording = false;
    if (signal.aborted) return;
    mic.classList.remove("rec");
    bird.classList.remove("listening");
    mic.style.setProperty("--lvl", "0");
    dbg.result = res instanceof AudioBuffer ? `buffer ${res.duration.toFixed(2)}s` : res;
    if (res === "denied" || res === "unsupported") return showMicOff();
    if (res === "empty") return;
    clip = res;
    note.classList.add("hidden");
    voices.classList.remove("hidden");
    play(VOICES[0]);
  }

  function showMicOff() {
    micOff.classList.remove("hidden");
    note.classList.remove("hidden");
    bird.classList.add("sad");
    void speak(PARROT_SAY.micOff);
  }

  mic.addEventListener("click", () => {
    if (rec) rec.stop();
    else void record();
  });
  bird.addEventListener("click", () => {
    if (clip) play(VOICES[0]);
    else bounce(bird);
  });
  signal.addEventListener("abort", () => {
    rec?.stop();
    stopVoice?.();
    clip = null;
  });
}
