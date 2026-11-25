/**
 * One shared Web Audio context for voice clips, recorded sounds and effects.
 * Web Audio (rather than <audio>) is what iOS reliably lets us play after the
 * first tap, even from inside timers and async code.
 */
let ctx: AudioContext | null = null;

export function audioContext(): AudioContext | null {
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
  const c = audioContext();
  if (!c) return;
  const b = c.createBuffer(1, 1, 22050);
  const s = c.createBufferSource();
  s.buffer = b;
  s.connect(c.destination);
  s.start(0);
}

const buffers = new Map<string, Promise<AudioBuffer | null>>();

/** Fetch and decode an audio file once; later calls reuse it. */
export function loadBuffer(url: string): Promise<AudioBuffer | null> {
  let p = buffers.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then(
        (data) =>
          new Promise<AudioBuffer>((resolve, reject) => {
            const c = audioContext();
            if (!c) return reject(new Error("no audio"));
            // Old Safari only supports the callback form.
            c.decodeAudioData(data, resolve, reject);
          }),
      )
      .catch(() => {
        buffers.delete(url);
        return null;
      });
    buffers.set(url, p);
  }
  return p;
}

let current: AudioBufferSourceNode | null = null;

/** Play a decoded buffer; resolves when it ends or is stopped. */
export function playBuffer(buf: AudioBuffer, volume = 1): Promise<void> {
  const c = audioContext();
  if (!c) return Promise.resolve();
  return new Promise((resolve) => {
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    g.gain.value = volume;
    src.connect(g).connect(c.destination);
    current = src;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (current === src) current = null;
      resolve();
    };
    src.onended = finish;
    // Safety net in case `ended` never fires (backgrounded tab etc.).
    const timer = setTimeout(finish, buf.duration * 1000 + 500);
    src.start();
  });
}

export function stopBuffer() {
  if (current) {
    try {
      current.stop();
    } catch {
      /* already stopped */
    }
    current = null;
  }
}
