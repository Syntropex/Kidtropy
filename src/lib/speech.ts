/**
 * Talking and listening, built on the browser's Web Speech API.
 *
 * - speak(): text-to-speech, works on basically every phone/tablet.
 * - listen(): speech recognition. Works in Safari on iPhone/iPad (iOS 14.5+)
 *   and Chrome on Android/desktop. Not in Firefox. Always have a fallback.
 *
 * Privacy note for grown-ups: the browser (Apple / Google) may send the audio
 * to its own servers to turn it into text. Kidtropy itself never records or
 * uploads anything.
 */
import { settings } from "./store";

const synth: SpeechSynthesis | undefined = typeof speechSynthesis !== "undefined" ? speechSynthesis : undefined;

let cachedVoice: SpeechSynthesisVoice | null | undefined;

const PREFERRED = [
  "Samantha", // iOS / macOS default US voice
  "Google US English",
  "Microsoft Aria Online (Natural) - English (United States)",
  "Microsoft Jenny Online (Natural) - English (United States)",
  "Karen",
  "Moira",
  "Tessa",
  "Daniel",
];

export function voices(): SpeechSynthesisVoice[] {
  return (synth?.getVoices() ?? []).filter((v) => v.lang.toLowerCase().startsWith("en"));
}

function pickVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice !== undefined) return cachedVoice;
  const all = voices();
  if (!all.length) return null; // not loaded yet; try again next time
  const chosen =
    (settings.voiceName && all.find((v) => v.name === settings.voiceName)) ||
    PREFERRED.map((n) => all.find((v) => v.name === n)).find(Boolean) ||
    all.find((v) => v.lang === "en-US" && v.localService) ||
    all.find((v) => v.lang === "en-US") ||
    all[0];
  cachedVoice = chosen ?? null;
  return cachedVoice;
}

export function resetVoice() {
  cachedVoice = undefined;
}

synth?.addEventListener?.("voiceschanged", () => resetVoice());

/** Say something. Resolves when finished (or interrupted). */
export function speak(text: string, opts: { rate?: number; pitch?: number; interrupt?: boolean } = {}): Promise<void> {
  if (!synth) return Promise.resolve();
  if (opts.interrupt !== false) {
    synth.cancel();
  }
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice();
    if (v) u.voice = v;
    u.lang = v?.lang ?? "en-US";
    u.rate = (opts.rate ?? 1) * settings.rate;
    u.pitch = opts.pitch ?? 1.1;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve();
    };
    u.onend = finish;
    u.onerror = finish;
    // Safari sometimes forgets to fire `end`; don't let the game get stuck.
    const timer = setTimeout(finish, 1500 + text.length * 110 / u.rate);
    synth.speak(u);
    // Chrome bug: long-idle synth can get "paused".
    if (synth.paused) synth.resume();
  });
}

export function stopSpeaking() {
  synth?.cancel();
}

/** Must be called from a tap so iOS lets us talk later. */
export function unlockSpeech() {
  if (!synth) return;
  const u = new SpeechSynthesisUtterance(" ");
  u.volume = 0;
  synth.speak(u);
}

// ---------------------------------------------------------------------------
// Listening

type Recognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
  onspeechstart?: (() => void) | null;
};

const RecognitionCtor: (new () => Recognition) | undefined =
  typeof window !== "undefined" ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : undefined;

export function canListen(): boolean {
  return !!RecognitionCtor && settings.useMic && micBlocked === false;
}

export function micSupported(): boolean {
  return !!RecognitionCtor;
}

let micBlocked = false;
let active: Recognition | null = null;

export interface ListenResult {
  /** Everything the recognizer thought it might have heard, best first. */
  alternatives: string[];
  /** Why we stopped: "result" | "silence" | "blocked" | "error" | "cancelled" */
  reason: "result" | "silence" | "blocked" | "error" | "cancelled";
}

/**
 * Listen for one short phrase.
 * `onHeard` fires with interim guesses so callers can react early.
 */
export function listen(opts: { timeoutMs?: number; onHeard?: (alts: string[]) => boolean | void } = {}): Promise<ListenResult> {
  if (!RecognitionCtor) return Promise.resolve({ alternatives: [], reason: "error" });
  cancelListening();
  return new Promise((resolve) => {
    const rec = new RecognitionCtor!();
    active = rec;
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.maxAlternatives = 5;
    rec.continuous = false;
    const heard: string[] = [];
    let reason: ListenResult["reason"] = "silence";
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (active === rec) active = null;
      resolve({ alternatives: [...new Set(heard)], reason: heard.length ? "result" : reason });
    };

    rec.onresult = (e: any) => {
      const alts: string[] = [];
      for (let i = e.resultIndex ?? 0; i < e.results.length; i++) {
        const res = e.results[i];
        for (let j = 0; j < res.length; j++) alts.push(String(res[j].transcript));
      }
      heard.push(...alts);
      if (opts.onHeard?.(alts) === true) {
        // Caller is happy already.
        try {
          rec.stop();
        } catch {
          /* ignore */
        }
        finish();
      }
    };
    rec.onerror = (e: any) => {
      if (e?.error === "not-allowed" || e?.error === "service-not-allowed") {
        micBlocked = true;
        reason = "blocked";
      } else if (e?.error === "aborted") {
        reason = "cancelled";
      } else if (e?.error === "no-speech") {
        reason = "silence";
      } else {
        reason = "error";
      }
    };
    rec.onend = finish;
    const timer = setTimeout(() => {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
      setTimeout(finish, 600);
    }, opts.timeoutMs ?? 6000);
    try {
      rec.start();
    } catch {
      reason = "error";
      finish();
    }
  });
}

export function cancelListening() {
  if (active) {
    try {
      active.abort();
    } catch {
      /* ignore */
    }
    active = null;
  }
}
