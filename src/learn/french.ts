/**
 * French for English-speaking little ones (Pre-K and Kindergarten).
 *
 * The English narrator explains, the French voice says the French word:
 * "[[fr:le chat]]" in a line is spoken by the French voice (see lines.ts).
 * Kids hear a French word and tap the picture; lessons teach a handful of
 * words at a time ("In French, cat is... le chat. Say it with me!").
 */
import { byId } from "../data/items";
import { h, pickOne, shuffle } from "../lib/ui";
import { cap } from "../voice/lines";
import { shape2d } from "./math-art";
import type { Choice, Grade, Lesson, LessonStep, Question, Skill } from "./types";
import { bigText, glyphPic, group, itemPic } from "./views";

interface Word {
  fr: string;
  en: string;
  /** Catalog item id, an emoji, a color, or a number. */
  item?: string;
  glyph?: string;
  color?: string;
  num?: number;
}

const ANIMALS: Word[] = [
  { fr: "le chat", en: "cat", item: "cat" },
  { fr: "le chien", en: "dog", item: "dog" },
  { fr: "la vache", en: "cow", item: "cow" },
  { fr: "le cochon", en: "pig", item: "pig" },
  { fr: "le cheval", en: "horse", item: "horse" },
  { fr: "le canard", en: "duck", item: "duck" },
  { fr: "le mouton", en: "sheep", item: "sheep" },
  { fr: "la poule", en: "chicken", item: "chicken" },
  { fr: "le lion", en: "lion", item: "lion" },
  { fr: "l'éléphant", en: "elephant", item: "elephant" },
  { fr: "le poisson", en: "fish", glyph: "🐟" },
  { fr: "l'oiseau", en: "bird", item: "bird" },
  { fr: "le lapin", en: "bunny", item: "rabbit" },
  { fr: "la souris", en: "mouse", item: "mouse" },
  { fr: "le singe", en: "monkey", item: "monkey" },
  { fr: "la grenouille", en: "frog", item: "frog" },
];

const COLORS: Word[] = [
  { fr: "rouge", en: "red", color: "#e53935" },
  { fr: "bleu", en: "blue", color: "#1e88e5" },
  { fr: "vert", en: "green", color: "#43a047" },
  { fr: "jaune", en: "yellow", color: "#fdd835" },
  { fr: "orange", en: "orange", color: "#fb8c00" },
  { fr: "violet", en: "purple", color: "#8e24aa" },
  { fr: "rose", en: "pink", color: "#f06292" },
  { fr: "noir", en: "black", color: "#37373f" },
  { fr: "blanc", en: "white", color: "#fafafa" },
  { fr: "marron", en: "brown", color: "#8d6e63" },
];

const HELLO: Word[] = [
  { fr: "bonjour", en: "hello", glyph: "👋" },
  { fr: "au revoir", en: "goodbye", glyph: "🚪" },
  { fr: "merci", en: "thank you", glyph: "🙏" },
  { fr: "oui", en: "yes", glyph: "👍" },
  { fr: "non", en: "no", glyph: "👎" },
  { fr: "bonne nuit", en: "good night", glyph: "🌙" },
  { fr: "s'il te plaît", en: "please", glyph: "🥺" },
];

const NUMBER_WORDS = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix"];
const EN_NUMBERS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
// Single-syllable French numbers are hard for the voice on their own; "le numéro sept" comes out clearly.
const numbers = (to: number): Word[] => Array.from({ length: to }, (_, i) => ({ fr: `le numéro ${NUMBER_WORDS[i + 1]}`, en: EN_NUMBERS[i + 1], num: i + 1 }));

const VEHICLES: Word[] = [
  { fr: "la voiture", en: "car", item: "car" },
  { fr: "le camion", en: "truck", item: "delivery" },
  { fr: "le bus", en: "bus", item: "bus" },
  { fr: "le train", en: "train", item: "train" },
  { fr: "l'avion", en: "airplane", item: "airplane" },
  { fr: "le bateau", en: "boat", item: "boat" },
  { fr: "le tracteur", en: "tractor", item: "tractor" },
  { fr: "le vélo", en: "bicycle", item: "bicycle" },
  { fr: "la moto", en: "motorcycle", item: "motorcycle" },
  { fr: "l'hélicoptère", en: "helicopter", item: "helicopter" },
  { fr: "la fusée", en: "rocket", item: "rocket" },
  { fr: "le camion de pompiers", en: "fire truck", item: "firetruck" },
];

const FOOD: Word[] = [
  { fr: "la pomme", en: "apple", item: "apple" },
  { fr: "la banane", en: "banana", glyph: "🍌" },
  { fr: "la carotte", en: "carrot", item: "carrot" },
  { fr: "le pain", en: "bread", glyph: "🍞" },
  { fr: "le lait", en: "milk", glyph: "🥛" },
  { fr: "le fromage", en: "cheese", glyph: "🧀" },
  { fr: "le gâteau", en: "cake", glyph: "🎂" },
  { fr: "la fraise", en: "strawberry", glyph: "🍓" },
  { fr: "l'œuf", en: "egg", item: "egg" },
  { fr: "la pizza", en: "pizza", glyph: "🍕" },
  { fr: "la glace", en: "ice cream", glyph: "🍦" },
  { fr: "le raisin", en: "grapes", glyph: "🍇" },
];

const BODY: Word[] = [
  { fr: "les yeux", en: "eyes", glyph: "👀" },
  { fr: "le nez", en: "nose", glyph: "👃" },
  { fr: "la bouche", en: "mouth", glyph: "👄" },
  { fr: "les oreilles", en: "ears", glyph: "👂" },
  { fr: "la main", en: "hand", glyph: "✋" },
  { fr: "la jambe", en: "leg", glyph: "🦵" },
  { fr: "les dents", en: "teeth", glyph: "🦷" },
  { fr: "les cheveux", en: "hair", glyph: "💇" },
];

const FAMILY: Word[] = [
  { fr: "ma maman", en: "mommy", glyph: "👩" },
  { fr: "mon papa", en: "daddy", glyph: "👨" },
  { fr: "le bébé", en: "baby", glyph: "👶" },
  { fr: "la grand-mère", en: "grandma", glyph: "👵" },
  { fr: "le grand-père", en: "grandpa", glyph: "👴" },
  { fr: "mon frère", en: "brother", glyph: "👦" },
  { fr: "ma sœur", en: "sister", glyph: "👧" },
];

// ---------------------------------------------------------------------------
// Sentences

export const FR_SAY = {
  find: "Can you find...",
  sayIt: "Say it with me!",
  inFrench: (en: string) => `In French, ${en} is...`,
  countIntro: "Let's count in French!",
  learn: (topic: string) => `Let's learn ${topic} in French!`,
  practiceIntro: "Listen to the French word, then tap the picture!",
};

const fr = (w: Word) => `[[fr:${w.fr}]]`;
const en = (w: Word) => `${cap(w.en)}!`;
/** French word, then what it means in English: "le chat... Cat!" */
const meaning = (w: Word) => `${fr(w)} ${en(w)}`;
const findPrompt = (w: Word) => `${FR_SAY.find} ${fr(w)}`;

function view(w: Word): HTMLElement {
  if (w.num !== undefined) return bigText(String(w.num));
  if (w.color) return h("span", { class: "pic art", html: shape2d("circle", w.color) });
  if (w.item) return itemPic(byId.get(w.item)!);
  return glyphPic(w.glyph!);
}

/** Bigger picture for lesson slides (numbers also show that many trucks). */
function slideView(w: Word): HTMLElement {
  if (w.num !== undefined) return h("div", { class: "lesson-card-inner" }, h("div", { class: "lesson-big" }, String(w.num)), group(byId.get("dumptruck")!, w.num));
  return h("div", { class: "lesson-pic" }, view(w));
}

function question(words: Word[], pool: Word[] = words): Question {
  const target = pickOne(words);
  const others = shuffle(pool.filter((w) => w !== target)).slice(0, 2);
  const options = shuffle([target, ...others]);
  return {
    prompt: findPrompt(target),
    praise: meaning(target),
    style: target.num !== undefined ? "big" : "pics",
    choices: options.map((w): Choice => ({ label: w.en, view: () => view(w), correct: w === target, say: meaning(w) })),
  };
}

function wordLines(words: Word[]): string[] {
  return words.flatMap((w) => [findPrompt(w), meaning(w), `${FR_SAY.inFrench(w.en)} ${fr(w)} ${FR_SAY.sayIt} ${fr(w)}`]);
}

function skill(id: string, grade: Grade, title: string, icon: string, words: Word[]): Skill {
  return {
    id,
    grade,
    area: "french",
    title,
    icon,
    intro: FR_SAY.practiceIntro,
    make: () => question(words),
    lines: () => [FR_SAY.find, FR_SAY.practiceIntro, ...wordLines(words)],
  };
}

function lesson(id: string, grade: Grade, title: string, icon: string, topic: string, words: Word[], skillId: string, pool: Word[]): Lesson {
  const intro = FR_SAY.learn(topic);
  return {
    id,
    grade,
    area: "french",
    title,
    icon,
    steps: () => {
      const steps: LessonStep[] = [{ say: intro, show: () => h("div", { class: "lesson-pic" }, glyphPic("🥐")) }];
      for (const w of words) steps.push({ say: `${FR_SAY.inFrench(w.en)} ${fr(w)} ${FR_SAY.sayIt} ${fr(w)}`, show: () => slideView(w) });
      steps.push({ practice: skillId, count: Math.min(5, words.length + 1), make: () => question(words, pool) });
      return steps;
    },
    lines: () => [intro, ...wordLines(words)],
  };
}

function countingLesson(id: string, grade: Grade, to: number, skillId: string): Lesson {
  const words = numbers(to);
  const counting = `[[fr:${NUMBER_WORDS.slice(1, to + 1).join(", ")} !]]`;
  return {
    id,
    grade,
    area: "french",
    title: `French 1 to ${to}`,
    icon: "🔢",
    steps: () => [
      { say: `${FR_SAY.countIntro} ${counting}`, show: () => h("div", { class: "lesson-card-inner" }, h("div", { class: "seq" }, Array.from({ length: to }, (_, i) => i + 1).join(" "))) },
      ...words.map((w) => ({ say: `${FR_SAY.inFrench(w.en)} ${fr(w)} ${FR_SAY.sayIt} ${fr(w)}`, show: () => slideView(w) })),
      { say: `${FR_SAY.countIntro} ${counting}`, show: () => h("div", { class: "lesson-card-inner" }, h("div", { class: "seq" }, Array.from({ length: to }, (_, i) => i + 1).join(" "))) },
      { practice: skillId, count: 5 },
    ],
    lines: () => [`${FR_SAY.countIntro} ${counting}`, ...wordLines(words)],
  };
}

export const FRENCH_SKILLS: Skill[] = [
  skill("fr-hello", "prek", "Bonjour!", "👋", HELLO),
  skill("fr-animals", "prek", "French Animals", "🐱", ANIMALS),
  skill("fr-colors", "prek", "French Colors", "🎨", COLORS),
  skill("fr-numbers-5", "prek", "French 1-2-3", "🔢", numbers(5)),
  skill("fr-numbers-10", "k", "French to 10", "🔢", numbers(10)),
  skill("fr-vehicles", "k", "French Vehicles", "🚗", VEHICLES),
  skill("fr-food", "k", "French Food", "🥐", FOOD),
  skill("fr-body", "k", "French Body", "👃", BODY),
  skill("fr-family", "k", "French Family", "👩", FAMILY),
  skill("fr-animals-k", "k", "French Animals", "🐱", ANIMALS),
];

export const FRENCH_LESSONS: Lesson[] = [
  lesson("fr-l-hello", "prek", "French Hello", "👋", "hello and goodbye", HELLO, "fr-hello", HELLO),
  lesson("fr-l-animals-1", "prek", "French Animals 1", "🐱", "animals", ANIMALS.slice(0, 8), "fr-animals", ANIMALS),
  lesson("fr-l-animals-2", "prek", "French Animals 2", "🦁", "more animals", ANIMALS.slice(8), "fr-animals", ANIMALS),
  lesson("fr-l-colors", "prek", "French Colors", "🎨", "colors", COLORS, "fr-colors", COLORS),
  countingLesson("fr-l-count-5", "prek", 5, "fr-numbers-5"),
  countingLesson("fr-l-count-10", "k", 10, "fr-numbers-10"),
  lesson("fr-l-vehicles", "k", "French Vehicles", "🚗", "things that go", VEHICLES, "fr-vehicles", VEHICLES),
  lesson("fr-l-food", "k", "French Food", "🥐", "food", FOOD, "fr-food", FOOD),
  lesson("fr-l-body", "k", "French Body", "👃", "my body", BODY, "fr-body", BODY),
  lesson("fr-l-family", "k", "French Family", "👩", "my family", FAMILY, "fr-family", FAMILY),
];
