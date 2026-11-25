/**
 * Everything Kidtropy remembers lives in this device's localStorage.
 * Nothing is ever sent to a server.
 */
import type { Theme } from "../data/items";

export interface Settings {
  themes: Theme[]; // empty = everything
  voiceName: string; // "" = auto-pick
  rate: number;
  useMic: boolean;
  choices: number; // how many pictures to choose from
  countMax: number;
  sfx: boolean;
}

export interface Progress {
  stars: number;
  stickers: string[]; // item ids, in the order they were earned
}

const DEFAULTS: Settings = {
  themes: [],
  voiceName: "",
  rate: 0.9,
  useMic: true,
  choices: 3,
  countMax: 5,
  sfx: true,
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : { ...fallback };
  } catch {
    return { ...fallback };
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode etc. — fine, just don't remember */
  }
}

export const settings: Settings = load("kidtropy.settings", DEFAULTS);
export const progress: Progress = load<Progress>("kidtropy.progress", { stars: 0, stickers: [] });

export function saveSettings() {
  save("kidtropy.settings", settings);
}

export function saveProgress() {
  save("kidtropy.progress", progress);
}

export function resetProgress() {
  progress.stars = 0;
  progress.stickers = [];
  saveProgress();
}
