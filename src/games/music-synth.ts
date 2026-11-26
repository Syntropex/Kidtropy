/**
 * Music's little synthesizer: a xylophone, a drum kit and a sample "piano",
 * all made with Web Audio (no files except the real animal sounds).
 *
 * Everything plays through one Mixer per visit to the game: a gain, a
 * compressor (so ten fingers at once never clip) and a fade-out that silences
 * whatever is still ringing when the child leaves.
 */
import { audioContext } from "../lib/audio";

/** C major, C5 to C6: the eight xylophone bars. */
export const SCALE_HZ = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5];
/** Semitones above C for each bar. */
export const SCALE_SEMIS = [0, 2, 4, 5, 7, 9, 11, 12];

export type Drum = "kick" | "snare" | "hat" | "tom" | "clap" | "crash";

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();

function noiseBuffer(c: BaseAudioContext): AudioBuffer {
  let b = noiseBuffers.get(c);
  if (!b) {
    const len = Math.floor(c.sampleRate * 2);
    b = c.createBuffer(1, len, c.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    noiseBuffers.set(c, b);
  }
  return b;
}

interface SampleInfo {
  /** Seconds of near-silence at the start (skipped so taps feel instant). */
  offset: number;
  /** Gain that brings the loudest peak to a common level. */
  gain: number;
}

const sampleInfo = new WeakMap<AudioBuffer, SampleInfo>();

function analyse(buf: AudioBuffer): SampleInfo {
  let info = sampleInfo.get(buf);
  if (info) return info;
  let peak = 0;
  let first = Infinity;
  for (let ch = 0; ch < buf.numberOfChannels; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < d.length; i++) {
      const a = Math.abs(d[i]);
      if (a > peak) peak = a;
      if (a > 0.03 && i < first) first = i;
    }
  }
  const offset = Number.isFinite(first) ? Math.max(0, first / buf.sampleRate - 0.005) : 0;
  info = { offset, gain: peak > 0 ? Math.min(3, Math.max(0.4, 0.7 / peak)) : 1 };
  sampleInfo.set(buf, info);
  return info;
}

export class Mixer {
  readonly ctx: AudioContext;
  private readonly input: GainNode;
  private readonly fade: GainNode;
  private readonly live = new Set<AudioScheduledSourceNode>();
  private closed = false;
  /** Sources started so far (handy for tests). */
  started = 0;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.input = ctx.createGain();
    this.input.gain.value = 0.55;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 8;
    comp.ratio.value = 10;
    comp.attack.value = 0.002;
    comp.release.value = 0.2;
    this.fade = ctx.createGain();
    this.input.connect(comp).connect(this.fade).connect(ctx.destination);
  }

  get now() {
    return this.ctx.currentTime;
  }

  get isClosed() {
    return this.closed;
  }

  /** Remember a source so close() can stop it. */
  private track<T extends AudioScheduledSourceNode>(node: T): T {
    this.live.add(node);
    this.started++;
    node.addEventListener("ended", () => this.live.delete(node));
    return node;
  }

  private env(at: number, peak: number, decay: number, attack = 0.002): GainNode {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(peak, at + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
    return g;
  }

  private osc(type: OscillatorType, freq: number, at: number, stop: number, dest: AudioNode): OscillatorNode {
    const o = this.track(this.ctx.createOscillator());
    o.type = type;
    o.frequency.setValueAtTime(freq, at);
    o.connect(dest);
    o.start(at);
    o.stop(stop);
    return o;
  }

  private noise(at: number, dur: number, dest: AudioNode) {
    const s = this.track(this.ctx.createBufferSource());
    s.buffer = noiseBuffer(this.ctx);
    s.connect(dest);
    s.start(at, Math.random() * 1.5);
    s.stop(at + dur);
  }

  private filter(type: BiquadFilterType, freq: number, q = 0.7): BiquadFilterNode {
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    return f;
  }

  /** One xylophone strike: a few sine partials that ring and fade fast. */
  mallet(freq: number, at = this.now, vel = 1) {
    if (this.closed) return;
    const partials: [ratio: number, gain: number, decay: number][] = [
      [1, 0.55, 1.1],
      [3.98, 0.16, 0.22],
      [9.1, 0.05, 0.05],
    ];
    for (const [ratio, gain, decay] of partials) {
      const g = this.env(at, gain * vel, decay);
      g.connect(this.input);
      this.osc("sine", freq * ratio, at, at + decay + 0.05, g);
    }
    // The soft "tock" of the mallet hitting wood.
    const click = this.env(at, 0.08 * vel, 0.012, 0.001);
    const bp = this.filter("bandpass", 2800, 1.2);
    bp.connect(click).connect(this.input);
    this.noise(at, 0.03, bp);
  }

  drum(kind: Drum, at = this.now, vel = 1) {
    if (this.closed) return;
    const c = this.ctx;
    switch (kind) {
      case "kick": {
        const g = this.env(at, 1.0 * vel, 0.42, 0.003);
        g.connect(this.input);
        const o = this.osc("sine", 150, at, at + 0.5, g);
        o.frequency.exponentialRampToValueAtTime(42, at + 0.14);
        const click = this.env(at, 0.25 * vel, 0.015, 0.001);
        const lp = this.filter("lowpass", 1800);
        lp.connect(click).connect(this.input);
        this.noise(at, 0.03, lp);
        break;
      }
      case "snare": {
        const ng = this.env(at, 0.5 * vel, 0.18);
        const hp = this.filter("highpass", 1200);
        hp.connect(ng).connect(this.input);
        this.noise(at, 0.25, hp);
        const tg = this.env(at, 0.4 * vel, 0.1);
        tg.connect(this.input);
        const o = this.osc("triangle", 220, at, at + 0.15, tg);
        o.frequency.exponentialRampToValueAtTime(160, at + 0.1);
        break;
      }
      case "hat": {
        const g = this.env(at, 0.32 * vel, 0.05, 0.001);
        const hp = this.filter("highpass", 7000);
        const bp = this.filter("bandpass", 10000, 0.8);
        hp.connect(bp).connect(g).connect(this.input);
        this.metal(at, 0.08, hp);
        this.noise(at, 0.08, hp);
        break;
      }
      case "tom": {
        const g = this.env(at, 0.8 * vel, 0.45, 0.003);
        g.connect(this.input);
        const o = this.osc("sine", 240, at, at + 0.5, g);
        o.frequency.exponentialRampToValueAtTime(120, at + 0.35);
        const ng = this.env(at, 0.12 * vel, 0.05);
        const lp = this.filter("lowpass", 3000);
        lp.connect(ng).connect(this.input);
        this.noise(at, 0.06, lp);
        break;
      }
      case "clap": {
        const bp = this.filter("bandpass", 1400, 1.1);
        const g = c.createGain();
        // Three quick slaps, then a little room tail.
        g.gain.setValueAtTime(0, at);
        for (const dt of [0, 0.011, 0.022]) {
          g.gain.setValueAtTime(0.75 * vel, at + dt);
          g.gain.exponentialRampToValueAtTime(0.08, at + dt + 0.01);
        }
        g.gain.setValueAtTime(0.5 * vel, at + 0.032);
        g.gain.exponentialRampToValueAtTime(0.0001, at + 0.22);
        bp.connect(g).connect(this.input);
        this.noise(at, 0.25, bp);
        break;
      }
      case "crash": {
        const g = this.env(at, 0.35 * vel, 1.4, 0.002);
        const hp = this.filter("highpass", 4500);
        hp.connect(g).connect(this.input);
        this.metal(at, 1.5, hp);
        this.noise(at, 1.5, hp);
        break;
      }
    }
  }

  /** Six detuned square waves: the classic metallic cymbal sound. */
  private metal(at: number, dur: number, dest: AudioNode) {
    const g = this.ctx.createGain();
    g.gain.value = 0.18;
    g.connect(dest);
    for (const r of [2, 3, 4.16, 5.43, 6.79, 8.21]) this.osc("square", 40 * r, at, at + dur, g);
  }

  /**
   * Play a recorded sound at a pitch (rate 1 = as recorded). Returns a stop
   * function that fades it out quickly.
   */
  sample(buf: AudioBuffer, rate: number, at = this.now, maxDur = 1.4): () => void {
    if (this.closed) return () => {};
    const { offset, gain } = analyse(buf);
    const s = this.track(this.ctx.createBufferSource());
    s.buffer = buf;
    s.playbackRate.value = rate;
    const g = this.ctx.createGain();
    const len = Math.min(maxDur, (buf.duration - offset) / rate);
    g.gain.setValueAtTime(gain, at);
    if (len >= maxDur) {
      g.gain.setValueAtTime(gain, at + len - 0.25);
      g.gain.linearRampToValueAtTime(0, at + len);
    }
    s.connect(g).connect(this.input);
    s.start(at, offset);
    s.stop(at + len + 0.02);
    return () => {
      const t = this.now;
      try {
        g.gain.cancelScheduledValues(t);
        g.gain.setValueAtTime(g.gain.value, t);
        g.gain.linearRampToValueAtTime(0, t + 0.04);
        s.stop(t + 0.05);
      } catch {
        /* already finished */
      }
    };
  }

  /** How many sounds are still ringing (for tests). */
  get liveCount() {
    return this.live.size;
  }

  /** Fade everything out and stop it. Further plays are ignored. */
  close() {
    if (this.closed) return;
    this.closed = true;
    const t = this.now;
    this.fade.gain.cancelScheduledValues(t);
    this.fade.gain.setValueAtTime(this.fade.gain.value, t);
    this.fade.gain.linearRampToValueAtTime(0, t + 0.06);
    for (const n of this.live) {
      try {
        n.stop(t + 0.08);
      } catch {
        /* not started or already stopped */
      }
    }
    this.live.clear();
    setTimeout(() => this.fade.disconnect(), 200);
  }
}

/** A mixer on the shared audio context, or null if there is no Web Audio. */
export function makeMixer(): Mixer | null {
  const c = audioContext();
  return c ? new Mixer(c) : null;
}

/**
 * A look-ahead scheduler on the audio clock (not setInterval timing): every
 * 25 ms `tick(until, self)` is asked to schedule whatever falls before `until`.
 * Return true from tick when finished. `show()` runs a visual at an audio time.
 */
export class Ticker {
  private timer: number;
  private readonly timeouts = new Set<number>();
  private stopped = false;

  constructor(
    private readonly mixer: Mixer,
    tick: (until: number, self: Ticker) => boolean | void,
    lookahead = 0.12,
  ) {
    const run = () => {
      if (this.stopped || mixer.isClosed) return this.stop();
      if (tick(mixer.now + lookahead, this) === true) this.stopTimer();
    };
    this.timer = window.setInterval(run, 25);
    run();
  }

  /** Run `fn` when the audio clock reaches `at` (roughly; it is only visual). */
  show(at: number, fn: () => void) {
    if (this.stopped) return;
    const id = window.setTimeout(() => {
      this.timeouts.delete(id);
      if (!this.stopped) fn();
    }, Math.max(0, (at - this.mixer.now) * 1000));
    this.timeouts.add(id);
  }

  get running() {
    return !this.stopped;
  }

  private stopTimer() {
    clearInterval(this.timer);
  }

  stop() {
    this.stopped = true;
    this.stopTimer();
    for (const id of this.timeouts) clearTimeout(id);
    this.timeouts.clear();
  }
}
