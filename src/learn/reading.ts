/** Reading skills and lessons (letters, sounds, rhymes, sight words, reading words). */
import "./reading.css";
import { h, makeDeck, pickOne, shuffle } from "../lib/ui";
import { cap } from "../voice/lines";
import {
  CVC,
  DIGRAPHS,
  FAMILIES,
  LESSON_FAMILIES,
  LETTER_PH,
  LETTER_WORD,
  LETTERS,
  LOOK_ALIKE,
  PIC,
  RHYMES,
  SENTENCES,
  SOUND_GROUPS,
  SOUND_OUT,
  SOUNDS,
  withArt,
  type Family,
  type Sound,
} from "./reading-data";
import type { Choice, Grade, Lesson, LessonStep, Question, Skill, SpeakAs } from "./types";
import { bigText, glyphPic, stage, wordText } from "./views";
import { SIGHT_G1, SIGHT_K } from "./words";

// ---------------------------------------------------------------------------
// Pictures and big text

function picOf(word: string): HTMLElement {
  const glyph = PIC[word];
  if (!glyph) throw new Error(`No picture for "${word}"`);
  return glyphPic(glyph);
}

const rdPic = (word: string, cls = "") => h("div", { class: `rd-pic ${cls}` }, picOf(word));
const rdLetter = (text: string) => h("div", { class: "rd-letter", "data-len": String(text.length) }, text);
const rdWord = (text: string) => h("div", { class: "rd-word" }, text);

/** A word with part of it colored: the family ending ("c" + "at") or the middle vowel. */
function marked(word: string, from: number, to: number, cls = "word-text"): HTMLElement {
  return h("span", { class: cls, "data-len": String(word.length) }, word.slice(0, from), h("b", { class: "rd-mark" }, word.slice(from, to)), word.slice(to));
}
const familyWord = (word: string, rime: string, cls?: string) => marked(word, word.length - rime.length, word.length, cls);

/** A lesson card: a big letter (or word), a picture and its name. */
function card(big: string, word?: string): HTMLElement {
  return h(
    "div",
    { class: "rd-card" },
    h("div", { class: "lesson-big rd-font" }, big),
    word ? h("div", { class: "lesson-pic" }, picOf(word)) : "",
    word ? h("div", { class: "lesson-word rd-font" }, word) : "",
  );
}

const sentenceView = (pic: string, text: string) => h("div", { class: "rd-sent" }, rdPic(pic), h("div", { class: "rd-sentence" }, text));

const row = (...items: (HTMLElement | string)[]) => h("div", { class: "rd-row" }, ...items);

// ---------------------------------------------------------------------------
// Everything we say (one place, so make() and lines() can't drift apart)

const lettersSpoken = (s: Sound) => s.letters.toUpperCase().split("").join(" ");
const lettersPh = (s: Sound) => s.letters.toUpperCase().split("").map((c) => LETTER_PH[c]).join(" ");

const SAY = {
  tapLetter: (L: string) => `Tap the letter ${L}!`,
  thatsLetter: (L: string) => `That's ${L}.`,
  isFor: (L: string, word = LETTER_WORD[L]) => `${L} is for ${word}!`,
  letter: (L: string) => `${L}!`,
  thisLetter: (L: string) => `This is the letter ${L}.`,
  sameLetter: "Find the same letter!",
  findLittle: (l: string) => `Find little ${l}!`,
  findBig: (L: string) => `Find big ${L}!`,
  bigLittle: (L: string) => `Big ${L}, little ${L.toLowerCase()}!`,
  thatsLittle: (l: string) => `That's little ${l}.`,
  thatsBig: (L: string) => `That's big ${L}.`,
  startsWith: (s: Sound) => `Which one starts with the ${s.say} sound?`,
  says: (s: Sound) => `${lettersSpoken(s)} says ${s.say}!`,
  middle: (s: Sound) => `Which one has the ${s.say} sound in the middle?`,
  thats: (w: string) => `That's ${withArt(w)}.`,
  name: (w: string) => `${cap(w)}!`,
  like: (...w: string[]) => `Like ${w.join(" and ")}!`,
  rhymeWith: (w: string) => `Which one rhymes with ${w}?`,
  rhymePair: (a: string, b: string) => `${cap(a)} and ${b} rhyme!`,
  tapWord: (w: string) => `Tap the word: ${w}.`,
  thatSays: (w: string) => `That says ${w}.`,
  thisWord: (w: string) => `This word is ${w}.`,
  itSays: (w: string) => `It says ${w}!`,
  readWord: "Read the word. Which picture is it?",
  whichWord: "Which word is it?",
  readSentence: "Read the sentence. Is it true?",
  isItTrue: "Is it true?",
  sameEnd: "They all end the same way!",
  list: (words: string[]) => `${cap(words.join(", "))}.`,
  /** "C, a, t." (said as the letters' sounds) */
  soundOut: (w: string) => `${cap(w.split("").join(", "))}.`,
};

// ---------------------------------------------------------------------------
// Question helpers

interface Maker {
  make: () => Question;
  lines: () => string[];
}

/** n random picks from `from`, skipping `not`. */
function some<T>(from: T[], n: number, not: (x: T) => boolean = () => false): T[] {
  return shuffle(from.filter((x) => !not(x))).slice(0, n);
}

function picChoice(word: string, correct = false): Choice {
  return { view: () => picOf(word), label: word, correct, say: correct ? undefined : SAY.thats(word) };
}

function letterChoice(L: string, correct: boolean, say: string): Choice {
  return { view: () => bigText(L, "rd-font"), label: L, correct, say: correct ? undefined : say };
}

/** Two wrong letters for `L`: a look-alike when there is one, plus a random one. */
function wrongLetters(L: string, pool: string[]): string[] {
  const alike = (LOOK_ALIKE[L] ?? []).filter((x) => pool.includes(x));
  const first = alike.length ? [pickOne(alike)] : [];
  return [...first, ...some(pool, 2 - first.length, (x) => x === L || first.includes(x))];
}

// ---------------------------------------------------------------------------
// Pre-K: letters

function lettersQ(pool: string[] = LETTERS): Maker {
  const next = makeDeck(() => pool, 3);
  return {
    make() {
      const L = next();
      const wrong = some(pool, 2, (x) => x === L);
      return {
        prompt: SAY.tapLetter(L),
        praise: SAY.isFor(L),
        style: "big",
        choices: shuffle([letterChoice(L, true, ""), ...wrong.map((x) => letterChoice(x, false, SAY.thatsLetter(x)))]),
      };
    },
    lines: () => pool.flatMap((L) => [SAY.tapLetter(L), SAY.isFor(L), SAY.thatsLetter(L)]),
  };
}

function letterMatchQ(): Maker {
  const next = makeDeck(() => LETTERS, 6);
  return {
    make() {
      const L = next();
      const lower = Math.random() < 0.4;
      const pool = lower ? LETTERS.map((x) => x.toLowerCase()) : LETTERS;
      const t = lower ? L.toLowerCase() : L;
      const wrong = wrongLetters(t, pool);
      return {
        prompt: SAY.sameLetter,
        show: () => stage(rdLetter(t)),
        praise: SAY.letter(L),
        style: "big",
        choices: shuffle([letterChoice(t, true, ""), ...wrong.map((x) => letterChoice(x, false, SAY.thatsLetter(x.toUpperCase())))]),
      };
    },
    lines: () => [SAY.sameLetter, ...LETTERS.flatMap((L) => [SAY.letter(L), SAY.thatsLetter(L)])],
  };
}

// ---------------------------------------------------------------------------
// Kindergarten: sounds, big and little letters, rhymes, sight words, short words

/** "Which one starts with the buh sound?" The wrong pictures start with other sounds. */
function soundsQ(sounds: Sound[], others: Sound[] = sounds, extra: (s: Sound) => string[] = () => []): Maker {
  const next = makeDeck(() => sounds, Math.min(3, sounds.length - 1));
  const wrongWords = (s: Sound) => [
    ...extra(s),
    ...others.filter((o) => o.say !== s.say).flatMap((o) => o.words),
  ];
  return {
    make() {
      const s = next();
      const word = pickOne(s.words);
      // two wrong pictures, each from a different sound
      const pool = others.filter((o) => o.say !== s.say);
      const fromExtra = extra(s);
      let wrong: string[];
      if (fromExtra.length && Math.random() < 0.5) {
        const o = pickOne(pool);
        wrong = [pickOne(fromExtra), pickOne(o.words)];
      } else {
        wrong = some(pool, 2).map((o) => pickOne(o.words));
      }
      return {
        prompt: SAY.startsWith(s),
        show: () => stage(rdLetter(s.letters)),
        praise: `${SAY.name(word)} ${SAY.says(s)}`,
        style: "pics",
        choices: shuffle([picChoice(word, true), ...wrong.map((w) => picChoice(w))]),
      };
    },
    lines: () =>
      sounds.flatMap((s) => [SAY.startsWith(s), SAY.says(s), ...s.words.map(SAY.name), ...wrongWords(s).map(SAY.thats)]),
  };
}

function upperLowerQ(): Maker {
  const next = makeDeck(() => LETTERS, 6);
  const lowers = LETTERS.map((x) => x.toLowerCase());
  return {
    make() {
      const L = next();
      const l = L.toLowerCase();
      const findLittle = Math.random() < 0.7;
      const t = findLittle ? l : L;
      const wrong = wrongLetters(t, findLittle ? lowers : LETTERS);
      return {
        prompt: findLittle ? SAY.findLittle(l) : SAY.findBig(L),
        show: () => stage(rdLetter(findLittle ? L : l)),
        praise: SAY.bigLittle(L),
        style: "big",
        choices: shuffle([
          letterChoice(t, true, ""),
          ...wrong.map((x) => letterChoice(x, false, findLittle ? SAY.thatsLittle(x) : SAY.thatsBig(x))),
        ]),
      };
    },
    lines: () =>
      LETTERS.flatMap((L) => {
        const l = L.toLowerCase();
        return [SAY.findLittle(l), SAY.findBig(L), SAY.bigLittle(L), SAY.thatsLittle(l), SAY.thatsBig(L)];
      }),
  };
}

function rhymesQ(): Maker {
  const pairs = RHYMES.flatMap((fam) => fam.map((w) => ({ w, fam })));
  const next = makeDeck(() => pairs, 8);
  return {
    make() {
      const { w, fam } = next();
      const rhyme = pickOne(fam.filter((x) => x !== w));
      const wrong = some(RHYMES, 2, (f) => f === fam).map((f) => pickOne(f));
      return {
        prompt: SAY.rhymeWith(w),
        show: () => stage(rdPic(w)),
        praise: SAY.rhymePair(rhyme, w),
        style: "pics",
        choices: shuffle([picChoice(rhyme, true), ...wrong.map((x) => picChoice(x))]),
      };
    },
    lines: () =>
      RHYMES.flatMap((fam) => fam.flatMap((w) => [SAY.rhymeWith(w), SAY.thats(w), ...fam.filter((x) => x !== w).map((x) => SAY.rhymePair(x, w))])),
  };
}

/** "Tap the word: see." Wrong words look a bit alike (same first letter or length) when possible. */
function sightQ(words: string[]): Maker {
  const next = makeDeck(() => words, Math.min(4, words.length - 1));
  const choice = (w: string, correct: boolean): Choice => ({ view: () => wordText(w), label: w, correct, say: correct ? undefined : SAY.thatSays(w) });
  return {
    make() {
      const w = next();
      const others = words.filter((x) => x.toLowerCase() !== w.toLowerCase());
      const alike = others.filter((x) => x[0].toLowerCase() === w[0].toLowerCase() || x.length === w.length);
      const first = alike.length && Math.random() < 0.7 ? [pickOne(alike)] : [];
      const wrong = [...first, ...some(others, 2 - first.length, (x) => first.includes(x))];
      return {
        prompt: SAY.tapWord(w),
        style: "words",
        choices: shuffle([choice(w, true), ...wrong.map((x) => choice(x, false))]),
      };
    },
    lines: () => words.flatMap((w) => [SAY.tapWord(w), SAY.thatSays(w)]),
  };
}

/** Wrong CVC words that share letters with `w`, so the child has to really read it. */
function nearWords(w: string, pool: string[], n: number): string[] {
  const score = (x: string) => [...x].filter((c, i) => w[i] === c).length;
  const near = shuffle(pool.filter((x) => x !== w && score(x) > 0));
  const out = near.slice(0, Math.random() < 0.5 ? n : 1);
  return [...out, ...some(pool, n - out.length, (x) => x === w || out.includes(x))];
}

function cvcQ(): Maker {
  const next = makeDeck(() => CVC, 8);
  return {
    make() {
      const w = next();
      const wrong = nearWords(w, CVC, 2);
      return {
        prompt: SAY.readWord,
        show: () => stage(rdWord(w)),
        praise: SAY.itSays(w),
        style: "pics",
        choices: shuffle([picChoice(w, true), ...wrong.map((x) => picChoice(x))]),
      };
    },
    lines: () => [SAY.readWord, ...CVC.flatMap((w) => [SAY.itSays(w), SAY.thats(w)])],
  };
}

// ---------------------------------------------------------------------------
// 1st grade: digraphs, word families, sentences, middle vowels

const soundOf = (letter: string) => SOUNDS.find((s) => s.letters === letter)!;

/** For sh/ch/th, a wrong picture can start with the plain first letter (sun vs. sheep). */
const digraphExtra = (d: Sound) => (d.id === "wh" ? [] : soundOf(d.letters[0]).words);

function digraphsQ(dgs: Sound[] = DIGRAPHS): Maker {
  return soundsQ(dgs, dgs, digraphExtra);
}

function familiesQ(): Maker {
  const targets = FAMILIES.flatMap((f) => f.pics.map((w) => ({ w, f })));
  const next = makeDeck(() => targets, 8);
  const all = (f: Family) => [...f.pics, ...f.more];
  return {
    make() {
      const { w, f } = next();
      const wrong = some(all(f), 2, (x) => x === w);
      const choice = (x: string, correct: boolean): Choice => ({
        view: () => familyWord(x, f.rime),
        label: x,
        correct,
        say: correct ? undefined : SAY.thatSays(x),
      });
      return {
        prompt: SAY.whichWord,
        show: () => stage(rdPic(w)),
        praise: SAY.itSays(w),
        style: "words",
        choices: shuffle([choice(w, true), ...wrong.map((x) => choice(x, false))]),
      };
    },
    lines: () => [SAY.whichWord, ...FAMILIES.flatMap((f) => [...f.pics.map(SAY.itSays), ...all(f).map(SAY.thatSays)])],
  };
}

function sentenceQ(): Maker {
  const next = makeDeck(() => SENTENCES, 8);
  return {
    make() {
      const s = next();
      return {
        prompt: SAY.readSentence,
        hint: `${s.text} ${SAY.isItTrue}`,
        show: () => stage(sentenceView(s.pic, s.text)),
        praise: s.why,
        style: "pics",
        choices: [
          { view: () => glyphPic("👍"), label: "True", correct: s.yes },
          { view: () => glyphPic("👎"), label: "Silly", correct: !s.yes },
        ],
      };
    },
    lines: () => [SAY.readSentence, SAY.isItTrue, ...SENTENCES.flatMap((s) => [s.text, s.why])],
  };
}

const VOWELS: Sound[] = ["a", "e", "i", "o", "u"].map((v) => {
  const s = SOUNDS.find((x) => x.letters === v);
  return s ?? { id: v, letters: v, say: v, ph: "ˈɪ", words: [] };
});
const cvcWith = (v: string) => CVC.filter((w) => w[1] === v);

function vowelsQ(): Maker {
  const next = makeDeck(() => VOWELS, 2);
  return {
    make() {
      const v = next();
      const word = pickOne(cvcWith(v.letters));
      const wrong = some(VOWELS, 2, (x) => x === v).map((x) => pickOne(cvcWith(x.letters)));
      return {
        prompt: SAY.middle(v),
        show: () => stage(rdLetter(v.letters)),
        praise: `${SAY.name(word)} ${SAY.says(v)}`,
        style: "pics",
        choices: shuffle([picChoice(word, true), ...wrong.map((x) => picChoice(x))]),
      };
    },
    lines: () => [...VOWELS.flatMap((v) => [SAY.middle(v), SAY.says(v)]), ...CVC.flatMap((w) => [SAY.name(w), SAY.thats(w)])],
  };
}

// ---------------------------------------------------------------------------
// Skills

function skill(id: string, grade: Grade, title: string, icon: string, intro: string, m: Maker): Skill {
  return { id, grade, area: "reading", title, icon, intro, make: m.make, lines: m.lines };
}

export const READING_SKILLS: Skill[] = [
  skill("letters", "prek", "Letters", "🔠", "Let's find letters!", lettersQ()),
  skill("letter-match", "prek", "Match letters", "🔍", "Let's match letters!", letterMatchQ()),

  skill("letter-sounds", "k", "Letter sounds", "👂", "Let's listen for sounds!", soundsQ(SOUNDS)),
  skill("upper-lower", "k", "Big and little", "🔡", "Big letters and little letters!", upperLowerQ()),
  skill("rhymes", "k", "Rhymes", "🎵", "Let's find words that rhyme!", rhymesQ()),
  skill("sight-k", "k", "Sight words", "👀", "Let's read words!", sightQ(SIGHT_K)),
  skill("cvc", "k", "Read words", "📖", "Let's read short words!", cvcQ()),

  skill("digraphs", "g1", "sh ch th wh", "🐑", "Two letters, one sound!", digraphsQ()),
  skill("vowel-sounds", "g1", "Middle sounds", "🍎", "Let's listen to the middle sound!", vowelsQ()),
  skill("sight-g1", "g1", "Sight words", "👓", "Let's read more words!", sightQ(SIGHT_G1)),
  skill("word-families", "g1", "Word families", "🏡", "Let's read word families!", familiesQ()),
  skill("read-sentence", "g1", "True or silly?", "👍", "Let's read sentences!", sentenceQ()),
];

// ---------------------------------------------------------------------------
// Lessons

type Slide = { say: string; show?: () => HTMLElement };

function lesson(id: string, grade: Grade, title: string, icon: string, build: () => { slides: Slide[]; practice: string; count: number; m?: Maker }): Lesson {
  return {
    id,
    grade,
    area: "reading",
    title,
    icon,
    steps(): LessonStep[] {
      const { slides, practice, count, m } = build();
      return [...slides, { practice, count, make: m?.make }];
    },
    lines() {
      const { slides, m } = build();
      return [...slides.map((s) => s.say), ...(m ? m.lines() : [])];
    },
  };
}

// Pre-K: letters in groups
const LETTER_GROUPS = ["ABCDE", "FGHIJ", "KLMNO", "PQRST", "UVWXYZ"];
const letterLessons = LETTER_GROUPS.map((g) => {
  const letters = g.split("");
  const title = `Letters ${letters[0]}–${letters[letters.length - 1]}`;
  return lesson(`l-letters-${g[0].toLowerCase()}`, "prek", title, PIC[LETTER_WORD[letters[0]]], () => ({
    slides: [
      { say: "Let's learn some letters!", show: () => row(...letters.map((L) => h("span", { class: "lesson-big rd-font rd-small" }, L))) },
      ...letters.map((L) => ({
        say: `${SAY.thisLetter(L)} ${SAY.isFor(L)}`,
        show: () => card(`${L}${L.toLowerCase()}`, LETTER_WORD[L]),
      })),
    ],
    practice: "letters",
    count: 5,
    m: lettersQ(letters),
  }));
});

// K: letter sounds in groups
const byId = (id: string) => [...SOUNDS, ...DIGRAPHS].find((s) => s.id === id)!;
const soundLessons = SOUND_GROUPS.map((ids, i) => {
  const sounds = ids.map(byId);
  return lesson(`l-sounds-${i + 1}`, "k", sounds.map((s) => s.letters).join(", "), PIC[sounds[0].words[0]], () => ({
    slides: [
      { say: "Every letter makes a sound. Let's listen!", show: () => row(...sounds.map((s) => h("span", { class: "lesson-big rd-font rd-small" }, s.letters))) },
      ...sounds.map((s) => {
        const L = s.letters.toUpperCase();
        const word = s.words[0];
        return { say: `${SAY.says(s)} ${SAY.isFor(L, word)}`, show: () => card(`${L}${s.letters}`, word) };
      }),
    ],
    practice: "letter-sounds",
    count: 5,
    m: soundsQ(sounds),
  }));
});

/** Sight word lessons: 5 words each. */
function sightLessons(list: string[], grade: Grade, skillId: string, icons: string[]): Lesson[] {
  return icons.map((icon, i) => {
    const words = list.slice(i * 5, i * 5 + 5);
    return lesson(`l-${skillId}-${i + 1}`, grade, `Sight words ${i + 1}`, icon, () => ({
      slides: [
        { say: "Let's learn new words!", show: () => row(...words.map((w) => h("span", { class: "rd-chip" }, w))) },
        ...words.map((w) => ({ say: SAY.thisWord(w), show: () => stage(rdWord(w)) })),
      ],
      practice: skillId,
      count: 5,
      m: sightQ(words),
    }));
  });
}

const BOOKS = ["📕", "📗", "📘", "📙", "📒", "📓"];

const rhymeLesson = lesson("l-rhymes", "k", "Rhyming words", "🎵", () => ({
  slides: [
    { say: `Rhyming words sound the same at the end. ${SAY.rhymePair("cat", "hat")}`, show: () => row(rdPic("cat", "lesson"), rdPic("hat", "lesson")) },
    ...[["bee", "tree"], ["moon", "spoon"], ["goat", "boat"]].map(([a, b]) => ({ say: SAY.rhymePair(a, b), show: () => row(rdPic(a, "lesson"), rdPic(b, "lesson")) })),
  ],
  practice: "rhymes",
  count: 6,
}));

const LESSON_SAY = {
  shortWords: "Let's read words! Say each sound. Then put them together.",
  teams: "Some letters team up to make a new sound!",
  families: "Words in a family end the same way.",
  sentences: "Let's read sentences! Some are true, and some are silly.",
  trueOne: "That's true! Tap thumbs up.",
  sillyOne: "That's silly! Tap thumbs down.",
  vowels: "A, E, I, O and U are vowels. Listen for them in the middle of a word!",
};

const shortWordsLesson = lesson("l-short-words", "k", "Reading short words", "📖", () => ({
  slides: [
    { say: LESSON_SAY.shortWords, show: () => stage(rdWord("cat")) },
    ...SOUND_OUT.map((w) => ({
      say: `${SAY.soundOut(w)} ${SAY.name(w)}`,
      show: () => h("div", { class: "rd-card" }, stage(rdWord(w.split("").join(" "))), h("div", { class: "lesson-pic" }, picOf(w))),
    })),
  ],
  practice: "cvc",
  count: 5,
}));

const digraphLesson = lesson("l-digraphs", "g1", "sh, ch, th", "🐑", () => {
  const dgs = DIGRAPHS.filter((d) => d.id !== "wh");
  return {
    slides: [
      { say: LESSON_SAY.teams, show: () => row(...dgs.map((d) => h("span", { class: "lesson-big rd-font rd-small" }, d.letters))) },
      ...dgs.map((d) => ({
        say: `${SAY.says(d)} ${SAY.like(d.words[0], d.words[1])}`,
        show: () => h("div", { class: "rd-card" }, h("div", { class: "lesson-big rd-font" }, d.letters), row(rdPic(d.words[0], "lesson"), rdPic(d.words[1], "lesson"))),
      })),
    ],
    practice: "digraphs",
    count: 6,
    m: digraphsQ(dgs),
  };
});

const familyLesson = lesson("l-word-families", "g1", "Word families", "🏡", () => ({
  slides: [
    { say: LESSON_SAY.families, show: () => stage(familyWord("cat", "at", "rd-word"), familyWord("hat", "at", "rd-word")) },
    ...LESSON_FAMILIES.map((rime) => {
      const f = FAMILIES.find((x) => x.rime === rime)!;
      const words = f.pics.slice(0, 3);
      return {
        say: `${SAY.list(words)} ${SAY.sameEnd}`,
        show: () => h("div", { class: "rd-fam" }, ...words.map((w) => h("div", { class: "rd-fam-item" }, rdPic(w), familyWord(w, rime, "rd-word")))),
      };
    }),
  ],
  practice: "word-families",
  count: 5,
}));

const sentenceLesson = lesson("l-sentences", "g1", "Reading sentences", "📝", () => {
  const [yes, no] = [SENTENCES.find((s) => s.text === "A fish can swim.")!, SENTENCES.find((s) => s.text === "A cow can fly.")!];
  const show = (s: typeof yes, thumb: string) => () =>
    h("div", { class: "rd-card" }, stage(sentenceView(s.pic, s.text)), h("div", { class: "rd-thumb" }, glyphPic(thumb)));
  return {
    slides: [
      { say: LESSON_SAY.sentences, show: () => row(rdPic("thumb", "lesson"), h("div", { class: "rd-pic lesson" }, glyphPic("👎"))) },
      { say: `${yes.text} ${LESSON_SAY.trueOne}`, show: show(yes, "👍") },
      { say: `${no.text} ${LESSON_SAY.sillyOne}`, show: show(no, "👎") },
    ],
    practice: "read-sentence",
    count: 5,
  };
});

const vowelLesson = lesson("l-vowels", "g1", "Vowel sounds", "🍎", () => ({
  slides: [
    { say: LESSON_SAY.vowels, show: () => row(...VOWELS.map((v) => h("span", { class: "lesson-big rd-font rd-small" }, v.letters))) },
    ...VOWELS.map((v) => {
      const w = cvcWith(v.letters)[0];
      return {
        say: `${SAY.says(v)} ${SAY.like(w)}`,
        show: () => h("div", { class: "rd-card" }, stage(marked(w, 1, 2, "rd-word")), h("div", { class: "lesson-pic" }, picOf(w))),
      };
    }),
  ],
  practice: "vowel-sounds",
  count: 5,
}));

export const READING_LESSONS: Lesson[] = [
  ...letterLessons,
  ...soundLessons,
  rhymeLesson,
  shortWordsLesson,
  ...sightLessons(SIGHT_K, "k", "sight-k", BOOKS),
  digraphLesson,
  familyLesson,
  vowelLesson,
  sentenceLesson,
  ...sightLessons(SIGHT_G1, "g1", "sight-g1", BOOKS),
];

// ---------------------------------------------------------------------------
// Hand-written pronunciations (Kokoro phonemes) for sentences with letter sounds.

const PH = {
  startsWith: (s: Sound) => `wˌɪtʃ wˈʌn stˈɑːɹts wɪð ðə ${s.ph} sˈaʊnd?`,
  middle: (s: Sound) => `wˌɪtʃ wˈʌn hɐz ðə ${s.ph} sˈaʊnd ɪn ðə mˈɪdəl?`,
  says: (s: Sound) => `${lettersPh(s)} sˈɛz, ${s.ph}!`,
  soundOut: (w: string) => `${w.split("").map((c) => soundOf(c).ph).join(", ")}.`,
};

function speakAs(): SpeakAs {
  const out: SpeakAs = {};
  for (const s of [...SOUNDS, ...DIGRAPHS]) out[SAY.startsWith(s)] = PH.startsWith(s);
  for (const s of [...SOUNDS, ...DIGRAPHS, ...VOWELS]) out[SAY.says(s)] = PH.says(s);
  for (const v of VOWELS) out[SAY.middle(v)] = PH.middle(v);
  for (const w of SOUND_OUT) out[SAY.soundOut(w)] = PH.soundOut(w);
  // "live" as in "I live here", not "a live show"
  out[SAY.tapWord("live")] = "tˈæp ðə wˈɜːd: lˈɪv.";
  out[SAY.thatSays("live")] = "ðæt sˈɛz lˈɪv.";
  out[SAY.thisWord("live")] = "ðɪs wˈɜːd ɪz lˈɪv.";
  return out;
}

export const READING_SPEAK_AS: SpeakAs = speakAs();
