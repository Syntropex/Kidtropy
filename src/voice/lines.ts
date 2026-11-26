/**
 * Everything Kidtropy says, in one place.
 *
 * Every sentence built here gets a pre-recorded natural voice clip
 * (see scripts/voice/). `allLines()` at the bottom lists every sentence the
 * app can say so the generator can record them all. When you add a new phrase
 * to a game, build it here and add it to `allLines()`, then run
 * `npm run voice`. Anything without a clip falls back to the device's voice.
 *
 * `[[snd:id]]` inside a line plays a real recorded sound (public/sounds/).
 */
import { ITEMS, withArticle, type Item } from "../data/items";
import SOUNDS from "./sounds.json";

export const NUMBERS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
export const COLOR_NAMES = ["red", "blue", "green", "yellow", "orange", "purple", "pink", "black", "white", "brown"];
export const SHAPE_NAMES = ["car", "truck", "race car"];
export const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export const ASK = ["What is this?", "What's this one?", "Ooh! What is it?", "Can you tell me what this is?", "Do you know what this is?"];
export const TALK_YES = ["Yes!", "You got it!", "That's right!", "Great job!", "Wow, you're so smart!", "Yay!"];
export const FIND_YES = ["Yes!", "You found it!", "Great job!", "Woo hoo!"];
export const COLOR_YES = ["Yes!", "Great job!", "You did it!"];
export const GO = ["Go go go!", "Go! Tap tap tap!"];
export const REVEAL_LEADS = ["Here's a hint!", "Did you say it?", "Hmm!", "Good try!"];
export const HINT_LEADS = ["Ooh, good try!", "I'm listening!"];
export const JOKES = [
  "Why did the cow cross the road? To get to the moo-vies!",
  "What do you call a sleeping dinosaur? A dino-snore!",
  "What kind of truck sings? A truck that rocks and rolls!",
  "Why do ducks have tail feathers? To cover their butt quacks!",
  "What does a construction worker eat? Dig-gestive cookies!",
];

/** Fixed lines, by name. */
export const SAY = {
  greet: "Hi! Let's play! Pick a game!",
  everything: "Everything!",
  stickers: "Look at all your stickers! Tap them!",
  noStickers: "Play games to get stickers!",
  newSticker: "Wow! You got a new sticker!",
  talkMenu: "Do you want me to ask you, or do you want to tell me?",
  letsPlay: "Let's play!",
  tryAnother: "Let's try another one!",
  showIntroMic: "Tap the microphone and tell me something to show you! Like dinosaur, or excavator!",
  showIntroTap: "Tap a picture and I'll tell you all about it!",
  hello: "Hi friend! Say the name of something and I'll show you!",
  myName: "I'm Kidtropy! I love trucks and dinosaurs!",
  roar: "ROAR! That was a big dinosaur roar!",
  dontKnow: "Hmm, I don't know that one yet! Try saying dinosaur, tractor, or cow!",
  didntHear: "I didn't hear you. Tap the button and talk to me!",
  tapMic: "Tap the microphone and tell me!",
  sayItOutLoud: "Say it out loud, then tap the thumbs up!",
  tapArrow: "Tap the arrow for a new picture!",
  abcIntro: "A, B, C! Tap a letter!",
  soundsIntro: "What do they say? Tap to find out!",
  digFirst: "Something is buried in the dirt! Rub with your finger to dig it up!",
  digAgain: "Dig, dig, dig! What's down there?",
  pickCar: "Pick your race car!",
  ready: "Ready...",
  set: "Set...",
  won: "You won! First place! You get the trophy!",
  countAgain: "Let's count again!",
  whoSaysThis: "Who says this?",
  voiceTest: "Hi! This is my voice!",
  speedTest: "Is this a good speed?",
};

/** Theme names, as spoken. */
export const THEME_SAY: Record<string, string> = {
  trucks: "Trucks and cars",
  construction: "Diggers",
  dinos: "Dinosaurs",
  animals: "Animals",
  farm: "Farm",
  racing: "Racing",
};

const SOUND_IDS = new Set<string>(SOUNDS as string[]);

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** A real recorded sound if we have one, otherwise the spoken sound word ("Moo!"). */
export function soundOf(item: Item): string {
  if (SOUND_IDS.has(item.id)) return `[[snd:${item.id}]]`;
  return item.sound ?? "";
}

export function hasRealSound(item: Item) {
  return SOUND_IDS.has(item.id);
}

export function plural(name: string): string {
  if (/(sheep|corn|T-rex|fish)$/i.test(name)) return name;
  if (/(s|sh|ch|x)$/.test(name)) return `${name}es`;
  if (/[^aeiou]y$/.test(name)) return `${name.slice(0, -1)}ies`;
  return `${name}s`;
}

const verb = (item: Item) => (item.themes.some((t) => t === "animals" || t === "farm" || t === "dinos") ? "says" : "goes");

export const line = {
  name: (item: Item) => `${cap(item.name)}!`,
  tapItem: (item: Item) => `${cap(withArticle(item))}! ${soundOf(item)}`,
  theme: (id: string, on: boolean) => (on ? `${THEME_SAY[id]}!` : `No more ${THEME_SAY[id].toLowerCase()}.`),
  newSticker: (item: Item) => `${SAY.newSticker} ${cap(item.name)}!`,

  // Talk Time
  ask: (i: number) => ASK[i % ASK.length],
  talkWin: (item: Item, yes: string) => `${yes} It's ${withArticle(item)}! ${soundOf(item)} ${item.fact ?? ""}`,
  reveal: (item: Item, lead: string) => `${lead} It's ${withArticle(item)}! Can you say ${item.name}?`,
  hint: (item: Item, lead: string) =>
    item.sound ? `${lead} Here's a hint. It ${verb(item)}... ${soundOf(item)} ${item.sound}` : `${lead} Here's a hint. It starts with ${firstLetter(item)}!`,
  showItem: (item: Item) => `Here's ${withArticle(item)}! ${soundOf(item)} ${item.fact ?? ""}`,

  // Find It
  findQuestions: (item: Item) => [`Where's the ${item.name}?`, `Tap the ${item.name}!`, `Can you find the ${item.name}?`],
  whoSays: (item: Item) => (hasRealSound(item) ? `${SAY.whoSaysThis} ${soundOf(item)}` : `Who says ${(item.sound ?? "").replace(/!$/, "").toLowerCase()}?`),
  findWin: (item: Item, yes: string) => `${yes} ${cap(withArticle(item))}! ${soundOf(item)}`,
  findWrong: (item: Item, then: string) => `That's ${withArticle(item)}. ${then}`,
  findThe: (item: Item) => `Find the ${item.name}!`,

  // Count It
  number: (n: number) => `${cap(NUMBERS[n])}!`,
  countStart: (item: Item) => `Let's count the ${plural(item.name)}! Tap each one.`,
  countAsk: (item: Item, n: number) => `${cap(NUMBERS[n])}! How many ${plural(item.name)}?`,
  countWin: (n: number) => `Yes! There ${n === 1 ? "is" : "are"} ${NUMBERS[n]}!`,
  countWrong: (n: number) => `That's ${NUMBERS[n]}. ${SAY.countAgain}`,

  // Colors
  colorQuestions: (color: string, shape: string) => [`Tap the ${color} ${shape}!`, `Where's the ${color} ${shape}?`, `Find the ${color} one!`],
  colorWin: (yes: string, color: string) => `${yes} ${cap(color)}!`,
  colorWrong: (got: string, want: string) => `That one is ${got}. Find ${want}!`,

  // ABC
  letter: (L: string, word: string) => `${L}! ${L} is for ${word}! ${L}, ${L}, ${word}!`,

  // Dino Dig
  digFound: (item: Item) => `You found ${withArticle(item)}! ${soundOf(item)} ${item.fact ?? ""}`,

  // Race
  carChosen: (color: string) => `The ${color} race car! Vroom!`,
  place: (n: number) => `You came in ${["", "first", "second", "third"][n]} place! Great racing!`,

  // Sounds
  saysWhat: (item: Item) => `The ${item.name} ${verb(item)}... ${soundOf(item)} ${item.sound ?? ""}`,
};

export function firstLetter(item: Item) {
  return item.name.charAt(0).toUpperCase();
}

// ---------------------------------------------------------------------------
// Sentence splitting, shared by the player and the generator.

/** say = English sentence, fr = French word or phrase (French voice), snd = real recorded sound. */
export type Part = { say: string } | { fr: string } | { snd: string };

/**
 * "Yes! It's a cow! [[snd:cow]] Cows give milk." -> sentences and sounds.
 * "[[fr:le chat]]" is spoken by the French voice.
 */
export function splitLine(text: string): Part[] {
  const parts: Part[] = [];
  for (const chunk of text.split(/(\[\[(?:snd|fr):[^\]]+\]\])/)) {
    const m = chunk.match(/^\[\[snd:([a-z0-9-]+)\]\]$/);
    if (m) {
      parts.push({ snd: m[1] });
      continue;
    }
    const f = chunk.match(/^\[\[fr:([^\]]+)\]\]$/);
    if (f) {
      parts.push({ fr: f[1].trim() });
      continue;
    }
    for (const s of chunk.split(/(?<=[.!?])\s+/)) {
      const t = s.replace(/\s+/g, " ").trim();
      if (t) parts.push({ say: t });
    }
  }
  return parts;
}

/** Stable short id for a sentence: FNV-1a, 8 hex chars. */
export function clipId(sentence: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < sentence.length; i++) {
    h ^= sentence.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

// ---------------------------------------------------------------------------
// Everything the app can say (for the voice generator and tests).

export interface ExtraWord {
  name: string;
}

export function allLines(extraItems: Item[] = [], letterWords: [string, string][] = []): string[] {
  const out: string[] = [];
  const add = (...s: string[]) => out.push(...s);

  add(...Object.values(SAY), ...ASK, ...TALK_YES, ...FIND_YES, ...COLOR_YES, ...GO, ...JOKES);
  for (const id of Object.keys(THEME_SAY)) add(line.theme(id, true), line.theme(id, false));
  for (let n = 1; n <= 10; n++) add(line.number(n), line.countWin(n), line.countWrong(n));
  for (let n = 1; n <= 3; n++) add(line.place(n));
  for (const c of COLOR_NAMES) {
    add(line.carChosen(c), line.colorWrong(c, c));
    for (const s of SHAPE_NAMES) add(...line.colorQuestions(c, s));
    for (const y of COLOR_YES) add(line.colorWin(y, c));
  }
  for (const [L, word] of letterWords) add(line.letter(L, word));

  // ABC words and Dig treasure only get named, tapped and found.
  for (const item of extraItems) add(line.name(item), line.tapItem(item), line.digFound(item));

  for (const item of ITEMS) {
    add(line.name(item), line.tapItem(item), line.newSticker(item), line.showItem(item), line.digFound(item), line.saysWhat(item));
    for (const y of TALK_YES) add(line.talkWin(item, y));
    for (const lead of REVEAL_LEADS) add(line.reveal(item, lead));
    for (const lead of HINT_LEADS) add(line.hint(item, lead));
    add(...line.findQuestions(item), line.findThe(item), line.findWrong(item, ""));
    if (item.sound) add(line.whoSays(item), `Who says ${item.sound.replace(/!$/, "").toLowerCase()}?`);
    for (const y of FIND_YES) add(line.findWin(item, y));
    add(line.countStart(item));
    for (let n = 1; n <= 10; n++) add(line.countAsk(item, n));
  }

  const sentences = new Set<string>();
  for (const l of out) for (const p of splitLine(l)) if ("say" in p) sentences.add(p.say);
  return [...sentences];
}
