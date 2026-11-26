/**
 * Soundboard-only buttons: instruments and everyday/fun sounds.
 * (Animals and vehicles come from the main catalog in items.ts.)
 * Every id here needs a real recording in public/sounds/<id>.mp3 (scripts/sounds/fetch.py).
 */
import type { Item } from "./items";

export interface ExtraTab {
  id: string;
  label: string;
  icon: string;
  color: string;
  /** Spoken when the tab is picked. */
  say: string;
  items: Item[];
}

const thing = (id: string, name: string, emoji: string, article?: string): Item => ({ id, name, emoji, themes: [], ...(article ? { article } : {}) });

export const EXTRA_TABS: ExtraTab[] = [
  {
    id: "instruments",
    label: "Instruments",
    icon: "🎺",
    color: "#5c6bc0",
    say: "Instruments!",
    items: [
      thing("trumpet", "trumpet", "🎺"),
      thing("guitar", "guitar", "🎸"),
      thing("drum", "drum", "🥁"),
      thing("violin", "violin", "🎻"),
      thing("saxophone", "saxophone", "🎷"),
      thing("bell", "bell", "🔔"),
      thing("banjo", "banjo", "🪕"),
      thing("accordion", "accordion", "🪗", "an"),
    ],
  },
  {
    id: "fun",
    label: "Fun sounds",
    icon: "🎉",
    color: "#ec407a",
    say: "Fun sounds!",
    items: [
      thing("harp", "magic wand", "🪄"),
      thing("sled", "sleigh bells", "🛷", "some"),
      thing("ufo", "flying saucer", "🛸"),
      thing("thunder", "thunder", "⛈️", "some"),
      thing("ocean", "ocean", "🌊", "an"),
      thing("fireworks", "fireworks", "🎆", "some"),
      thing("doorbell", "doorbell", "🛎️"),
      thing("phone", "phone", "☎️"),
      thing("alarm", "alarm clock", "⏰", "an"),
      thing("baby", "baby", "👶"),
      thing("sneeze", "sneeze", "🤧"),
      thing("snore", "snoring", "😴", "some"),
      thing("balloon", "balloon", "🎈"),
      thing("camera", "camera", "📸"),
      thing("toilet", "toilet", "🚽"),
      thing("kiss", "kiss", "😘"),
      thing("slide", "slide whistle", "🛝"),
      thing("boing", "boing", "🤸"),
      thing("laugh", "laughing", "😂", "some"),
    ],
  },
];

export const SOUND_EXTRAS: Item[] = EXTRA_TABS.flatMap((t) => t.items);
