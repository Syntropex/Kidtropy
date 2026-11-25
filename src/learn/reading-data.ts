/**
 * Word and picture data for the reading skills (src/learn/reading.ts).
 *
 * Pictures are emoji glyphs (drawn as Fluent 3D pictures, see scripts/pics/).
 * Every word here was picked to be easy for a 4-year-old to name from its
 * picture, and to start with a clean sound (no silent letters, no soft c/g,
 * no blends where it matters).
 */

/** Picture word -> emoji. */
export const PIC: Record<string, string> = {
  // a e o u (short vowels)
  apple: "🍎", ant: "🐜", astronaut: "🧑‍🚀",
  egg: "🥚", elephant: "🐘",
  octopus: "🐙", otter: "🦦",
  umbrella: "☂️",
  // consonants
  bus: "🚌", bee: "🐝", bear: "🐻", banana: "🍌", bed: "🛏️", bell: "🔔", bat: "🦇", box: "📦", bug: "🐛", bone: "🦴", boat: "⛵", bird: "🐦", bread: "🍞", balloon: "🎈",
  cat: "🐱", cow: "🐮", car: "🚗", cake: "🎂", corn: "🌽", coat: "🧥", clock: "⏰",
  dog: "🐶", duck: "🦆", door: "🚪", deer: "🦌",
  fish: "🐟", fox: "🦊", fire: "🔥", foot: "🦶", frog: "🐸",
  goat: "🐐", gorilla: "🦍", ghost: "👻", guitar: "🎸",
  horse: "🐴", house: "🏠", hammer: "🔨", heart: "❤️", hippo: "🦛", hat: "🎩",
  "ice cream": "🍦",
  juice: "🧃", jellyfish: "🪼", jar: "🫙",
  kite: "🪁", key: "🔑", kangaroo: "🦘", koala: "🐨", king: "🤴",
  lion: "🦁", lemon: "🍋", leaf: "🍁", ladybug: "🐞", lollipop: "🍭", log: "🪵", leg: "🦵",
  monkey: "🐵", moon: "🌙", mouse: "🐭", milk: "🥛", mushroom: "🍄", map: "🗺️",
  nose: "👃", nest: "🪺",
  pig: "🐷", penguin: "🐧", pizza: "🍕", pear: "🍐", panda: "🐼", popcorn: "🍿", pen: "🖊️", pin: "📌", phone: "📱",
  queen: "👸",
  rocket: "🚀", rainbow: "🌈", ring: "💍", robot: "🤖", rose: "🌹", rat: "🐀", rock: "🪨",
  sun: "☀️", sock: "🧦", seal: "🦭", sandwich: "🥪", snake: "🐍", star: "⭐", spoon: "🥄", sled: "🛷", snail: "🐌", six: "6️⃣",
  tiger: "🐯", turtle: "🐢", tooth: "🦷", tent: "⛺", tomato: "🍅", taco: "🌮", ten: "🔟", tree: "🌳", truck: "🚚",
  van: "🚐", volcano: "🌋", violin: "🎻",
  watermelon: "🍉", worm: "🪱", wolf: "🐺", web: "🕸️", watch: "⌚",
  "x-ray": "🩻",
  "yo-yo": "🪀", yarn: "🧶",
  zebra: "🦓",
  // digraphs
  sheep: "🐑", shoe: "👟", ship: "🚢", shark: "🦈", shell: "🐚", shirt: "👕",
  chicken: "🐔", cheese: "🧀", chair: "🪑", cherry: "🍒", chick: "🐤",
  thumb: "👍", three: "3️⃣", thermometer: "🌡️",
  whale: "🐳", wheel: "🛞",
  // sentences
  ice: "🧊", ball: "⚽",
};

/** Words we say without "a"/"an" ("That's milk."). */
const NO_ARTICLE = new Set(["milk", "juice", "corn", "popcorn", "fire", "cheese", "yarn", "ice"]);
const AN = new Set(["apple", "ant", "astronaut", "egg", "elephant", "octopus", "otter", "umbrella", "ice cream", "x-ray"]);

const THE = new Set(["sun", "moon"]);

export function withArt(word: string): string {
  if (NO_ARTICLE.has(word)) return word;
  if (THE.has(word)) return `the ${word}`;
  return `${AN.has(word) ? "an" : "a"} ${word}`;
}

export const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/** "A is for apple!" (Pre-K letter lessons and the Letters skill). */
export const LETTER_WORD: Record<string, string> = {
  A: "apple", B: "bus", C: "cat", D: "dog", E: "egg", F: "fish", G: "goat", H: "horse", I: "ice cream", J: "juice",
  K: "kite", L: "lion", M: "moon", N: "nose", O: "octopus", P: "pig", Q: "queen", R: "rocket", S: "sun", T: "tiger",
  U: "umbrella", V: "van", W: "watermelon", X: "x-ray", Y: "yo-yo", Z: "zebra",
};

/** Letter names in Kokoro phonemes (for sentences with hand-written pronunciation). */
export const LETTER_PH: Record<string, string> = {
  A: "ˈeɪ", B: "bˈiː", C: "sˈiː", D: "dˈiː", E: "ˈiː", F: "ˈɛf", G: "dʒˈiː", H: "ˈeɪtʃ", I: "ˈaɪ", J: "dʒˈeɪ", K: "kˈeɪ",
  L: "ˈɛl", M: "ˈɛm", N: "ˈɛn", O: "ˈoʊ", P: "pˈiː", Q: "kjˈuː", R: "ˈɑːɹ", S: "ˈɛs", T: "tˈiː", U: "jˈuː", V: "vˈiː",
  W: "dˈʌbəljˌuː", X: "ˈɛks", Y: "wˈaɪ", Z: "zˈiː",
};

/** Letters that look alike (for harder wrong answers). */
export const LOOK_ALIKE: Record<string, string[]> = {
  A: ["H", "V"], B: ["D", "P", "R"], C: ["G", "O"], D: ["O", "B"], E: ["F", "B"], F: ["E", "P"], G: ["C", "Q"], H: ["N", "A"],
  I: ["L", "T", "J"], J: ["I", "T"], K: ["X", "R"], L: ["I", "J"], M: ["N", "W"], N: ["M", "H"], O: ["Q", "C", "D"], P: ["R", "B", "F"],
  Q: ["O", "G"], R: ["P", "B", "K"], S: ["Z"], T: ["I", "J"], U: ["V", "O"], V: ["W", "U"], W: ["M", "V"], X: ["K", "Y"],
  Y: ["V", "X"], Z: ["S", "N"],
  a: ["o", "e", "d"], b: ["d", "p", "h"], c: ["o", "e"], d: ["b", "q", "p"], e: ["a", "c", "o"], f: ["t"], g: ["q", "j", "y"],
  h: ["n", "b"], i: ["l", "j"], j: ["i", "g"], k: ["h", "x"], l: ["i", "t"], m: ["n", "w"], n: ["m", "h", "u"], o: ["c", "a"],
  p: ["q", "b", "d"], q: ["p", "g", "d"], r: ["n"], s: ["z"], t: ["f", "l"], u: ["n", "v"], v: ["w", "y"], w: ["v", "m"],
  x: ["k"], y: ["v", "g"], z: ["s"],
};

/**
 * A sound kids learn. `say` is how we write it in sentences ("the buh sound");
 * `ph` is how Kokoro should say it.
 */
export interface Sound {
  id: string;
  /** The letter(s), lowercase: "b", "sh". */
  letters: string;
  say: string;
  ph: string;
  /** Picture words that start with this sound (first one is used in lessons). */
  words: string[];
}

const V = (ph: string) => `ˈ${ph}ː`; // a vowel or a hummable sound, held a little
const STOP = (ph: string) => `${ph}ˈʌ`; // a stop: "buh"

export const SOUNDS: Sound[] = [
  { id: "a", letters: "a", say: "a", ph: V("æ"), words: ["apple", "ant", "astronaut"] },
  { id: "b", letters: "b", say: "buh", ph: STOP("b"), words: ["bus", "bee", "bear", "banana", "bed", "bell"] },
  { id: "k", letters: "c", say: "kuh", ph: STOP("k"), words: ["cat", "cow", "car", "cake", "corn"] },
  { id: "d", letters: "d", say: "duh", ph: STOP("d"), words: ["dog", "duck", "door", "deer"] },
  { id: "e", letters: "e", say: "e", ph: V("ɛ"), words: ["egg", "elephant"] },
  { id: "f", letters: "f", say: "fff", ph: V("f"), words: ["fish", "fox", "fire", "foot"] },
  { id: "g", letters: "g", say: "guh", ph: STOP("ɡ"), words: ["goat", "gorilla", "ghost", "guitar"] },
  { id: "h", letters: "h", say: "huh", ph: STOP("h"), words: ["horse", "house", "hammer", "heart", "hippo"] },
  { id: "j", letters: "j", say: "juh", ph: STOP("dʒ"), words: ["juice", "jellyfish"] },
  { id: "k2", letters: "k", say: "kuh", ph: STOP("k"), words: ["kite", "key", "kangaroo", "koala"] },
  { id: "l", letters: "l", say: "lll", ph: V("l"), words: ["lion", "lemon", "leaf", "ladybug", "lollipop"] },
  { id: "m", letters: "m", say: "mmm", ph: V("m"), words: ["moon", "monkey", "mouse", "milk", "mushroom"] },
  { id: "n", letters: "n", say: "nnn", ph: V("n"), words: ["nose", "nest"] },
  { id: "o", letters: "o", say: "o", ph: V("ɑ"), words: ["octopus", "otter"] },
  { id: "p", letters: "p", say: "puh", ph: STOP("p"), words: ["pig", "penguin", "pizza", "pear", "panda", "popcorn"] },
  { id: "r", letters: "r", say: "rrr", ph: V("ɹ"), words: ["rocket", "rainbow", "ring", "robot", "rose"] },
  { id: "s", letters: "s", say: "sss", ph: V("s"), words: ["sun", "sock", "seal", "sandwich", "snake"] },
  { id: "t", letters: "t", say: "tuh", ph: STOP("t"), words: ["tiger", "turtle", "tooth", "tent", "tomato", "taco"] },
  { id: "u", letters: "u", say: "u", ph: V("ʌ"), words: ["umbrella"] },
  { id: "v", letters: "v", say: "vvv", ph: V("v"), words: ["van", "volcano", "violin"] },
  { id: "w", letters: "w", say: "wuh", ph: STOP("w"), words: ["watermelon", "worm", "wolf", "web", "watch"] },
  { id: "y", letters: "y", say: "yuh", ph: STOP("j"), words: ["yo-yo", "yarn"] },
  { id: "z", letters: "z", say: "zzz", ph: V("z"), words: ["zebra"] },
];

/** Two letters, one sound (1st grade). */
export const DIGRAPHS: Sound[] = [
  { id: "sh", letters: "sh", say: "shh", ph: V("ʃ"), words: ["sheep", "shoe", "ship", "shark", "shell", "shirt"] },
  { id: "ch", letters: "ch", say: "ch", ph: STOP("tʃ"), words: ["chicken", "cheese", "chair", "cherry", "chick"] },
  { id: "th", letters: "th", say: "th", ph: V("θ"), words: ["thumb", "three", "thermometer"] },
  { id: "wh", letters: "wh", say: "wh", ph: STOP("w"), words: ["whale", "wheel"] },
];

/** Letter-sound lessons (Kindergarten), in a common teaching order. */
export const SOUND_GROUPS: string[][] = [
  ["m", "s", "a", "t", "p"],
  ["n", "k", "o", "d", "f"],
  ["g", "h", "e", "b", "l"],
  ["k2", "r", "u", "j"],
  ["v", "w", "y", "z"],
];

/** Rhyming picture words. */
export const RHYMES: string[][] = [
  ["cat", "hat", "bat", "rat"],
  ["dog", "frog", "log"],
  ["bee", "tree", "key"],
  ["cake", "snake"],
  ["moon", "spoon", "balloon"],
  ["star", "car", "jar"],
  ["fox", "box"],
  ["bear", "pear", "chair"],
  ["goat", "boat", "coat"],
  ["mouse", "house"],
  ["bed", "sled", "bread"],
  ["ring", "king"],
  ["snail", "whale"],
  ["bell", "shell"],
  ["sock", "rock", "clock"],
  ["phone", "bone"],
  ["nose", "rose"],
  ["pen", "ten"],
  ["duck", "truck"],
];

/** Short-vowel consonant-vowel-consonant words with pictures. */
export const CVC = ["cat", "hat", "bat", "rat", "map", "van", "bed", "web", "pen", "ten", "leg", "pig", "pin", "six", "dog", "log", "box", "fox", "sun", "bus", "bug"];

/** Word families: words with pictures first, then more words in the family. */
export interface Family {
  rime: string;
  pics: string[];
  more: string[];
}

export const FAMILIES: Family[] = [
  { rime: "at", pics: ["cat", "hat", "bat", "rat"], more: ["mat", "sat", "fat", "pat"] },
  { rime: "og", pics: ["dog", "log", "frog"], more: ["hog", "jog", "fog"] },
  { rime: "ig", pics: ["pig"], more: ["wig", "dig", "big", "fig"] },
  { rime: "ug", pics: ["bug"], more: ["rug", "hug", "mug", "jug"] },
  { rime: "un", pics: ["sun"], more: ["run", "fun", "bun"] },
  { rime: "en", pics: ["pen", "ten"], more: ["men", "hen", "den"] },
  { rime: "ed", pics: ["bed", "sled"], more: ["red", "fed"] },
  { rime: "an", pics: ["van"], more: ["man", "can", "fan", "pan"] },
  { rime: "ap", pics: ["map"], more: ["cap", "tap", "nap"] },
  { rime: "in", pics: ["pin"], more: ["win", "fin", "bin"] },
  { rime: "ake", pics: ["cake", "snake"], more: ["lake", "make", "bake"] },
  { rime: "ing", pics: ["ring", "king"], more: ["sing", "wing"] },
  { rime: "ell", pics: ["bell", "shell"], more: ["well", "tell", "fell"] },
  { rime: "ock", pics: ["sock", "rock", "clock"], more: ["lock", "dock"] },
  { rime: "ee", pics: ["bee", "tree"], more: ["see", "free"] },
  { rime: "oat", pics: ["goat", "boat", "coat"], more: ["moat"] },
  { rime: "ar", pics: ["car", "star", "jar"], more: ["far"] },
  { rime: "oon", pics: ["moon", "spoon"], more: ["soon", "noon"] },
  { rime: "ail", pics: ["snail"], more: ["mail", "tail", "nail", "pail"] },
  { rime: "ish", pics: ["fish"], more: ["dish", "wish"] },
];

/** True or silly? Short sentences made of sight words and short words. */
export interface Sentence {
  text: string;
  pic: string;
  yes: boolean;
  /** Said after the answer. */
  why: string;
}

export const SENTENCES: Sentence[] = [
  { text: "A fish can swim.", pic: "fish", yes: true, why: "Fish can swim!" },
  { text: "A bird can fly.", pic: "bird", yes: true, why: "Birds can fly!" },
  { text: "A dog can run.", pic: "dog", yes: true, why: "Dogs can run!" },
  { text: "A frog can jump.", pic: "frog", yes: true, why: "Frogs can jump!" },
  { text: "The sun is hot.", pic: "sun", yes: true, why: "The sun is hot!" },
  { text: "A cow says moo.", pic: "cow", yes: true, why: "Cows say moo!" },
  { text: "A duck can swim.", pic: "duck", yes: true, why: "Ducks can swim!" },
  { text: "Ice is cold.", pic: "ice", yes: true, why: "Ice is cold!" },
  { text: "A bee can fly.", pic: "bee", yes: true, why: "Bees can fly!" },
  { text: "A cat says meow.", pic: "cat", yes: true, why: "Cats say meow!" },
  { text: "A ball is round.", pic: "ball", yes: true, why: "Balls are round!" },
  { text: "You can eat a cake.", pic: "cake", yes: true, why: "Cake is yummy!" },
  { text: "A cow can fly.", pic: "cow", yes: false, why: "Cows can't fly!" },
  { text: "A fish can run.", pic: "fish", yes: false, why: "Fish can't run!" },
  { text: "A pig can read.", pic: "pig", yes: false, why: "Pigs can't read!" },
  { text: "The sun is cold.", pic: "sun", yes: false, why: "The sun is hot!" },
  { text: "A dog says moo.", pic: "dog", yes: false, why: "Dogs say woof!" },
  { text: "Ice is hot.", pic: "ice", yes: false, why: "Ice is cold!" },
  { text: "A cat can fly.", pic: "cat", yes: false, why: "Cats can't fly!" },
  { text: "A hat can jump.", pic: "hat", yes: false, why: "Hats can't jump!" },
  { text: "You can eat a rock.", pic: "rock", yes: false, why: "You can't eat rocks!" },
  { text: "A duck says oink.", pic: "duck", yes: false, why: "Ducks say quack!" },
  { text: "A car can swim.", pic: "car", yes: false, why: "Cars can't swim!" },
  { text: "A bed can run.", pic: "bed", yes: false, why: "Beds can't run!" },
];

/** Word families shown in the lesson. */
export const LESSON_FAMILIES = ["at", "og", "ock"];
/** Words sounded out in the "Reading short words" lesson. */
export const SOUND_OUT = ["cat", "dog", "sun"];
