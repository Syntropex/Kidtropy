/**
 * Tiny synthesized sound effects (no audio files to download).
 */
import { settings } from "./store";

let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  if (!settings.sfx) return null;
  if (!ctx) {
    const C = window.AudioContext || (window as any).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Call from a tap so iOS lets us play sounds. */
export function unlockAudio() {
  const c = ac();
  if (!c) return;
  const b = c.createBuffer(1, 1, 22050);
  const s = c.createBufferSource();
  s.buffer = b;
  s.connect(c.destination);
  s.start(0);
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", vol = 0.25, endFreq?: number) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + start;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise(start: number, dur: number, vol = 0.2, freq = 1200) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + start;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(c.destination);
  src.start(t);
}

export const sfx = {
  pop() {
    tone(500, 0, 0.12, "sine", 0.3, 1100);
  },
  tap() {
    tone(700, 0, 0.06, "triangle", 0.15);
  },
  correct() {
    tone(660, 0, 0.12, "triangle", 0.25);
    tone(880, 0.1, 0.12, "triangle", 0.25);
    tone(1320, 0.2, 0.25, "triangle", 0.25);
  },
  oops() {
    tone(300, 0, 0.18, "sine", 0.2, 220);
    tone(260, 0.16, 0.22, "sine", 0.2, 180);
  },
  fanfare() {
    const notes = [523, 659, 784, 1047, 784, 1047];
    notes.forEach((n, i) => tone(n, i * 0.12, i === notes.length - 1 ? 0.5 : 0.14, "square", 0.12));
  },
  sticker() {
    [784, 988, 1175, 1568].forEach((n, i) => tone(n, i * 0.07, 0.2, "sine", 0.2));
  },
  beep(high = false) {
    tone(high ? 880 : 440, 0, high ? 0.5 : 0.25, "square", 0.15);
  },
  vroom() {
    tone(80, 0, 0.7, "sawtooth", 0.12, 260);
    tone(82, 0, 0.7, "sawtooth", 0.08, 270);
  },
  honk() {
    tone(392, 0, 0.18, "square", 0.12);
    tone(330, 0, 0.18, "square", 0.12);
    tone(392, 0.22, 0.3, "square", 0.12);
    tone(330, 0.22, 0.3, "square", 0.12);
  },
  dig() {
    noise(0, 0.08, 0.15, 600 + Math.random() * 600);
  },
  whoosh() {
    noise(0, 0.35, 0.25, 2500);
  },
  listen() {
    tone(880, 0, 0.1, "sine", 0.2);
    tone(1320, 0.08, 0.12, "sine", 0.2);
  },
};
