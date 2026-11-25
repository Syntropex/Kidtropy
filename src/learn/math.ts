/**
 * Math skills and lessons for Pre-K, Kindergarten and 1st grade.
 * Every sentence a skill can say is built by the `say` helpers below so that
 * `lines()` can list them all for the recorded voice.
 */
import { byId, ITEMS, type Item } from "../data/items";
import { h, pickOne, pool, shuffle } from "../lib/ui";
import { COLOR_NAMES, cap, NUMBERS, plural } from "../voice/lines";
import { baseTen, clockFace, crayon, SHAPE_FACTS, shape2d, SHAPES_2D, solid, SOLID_FACTS, SOLIDS, type Shape2D, type Solid } from "./math-art";
import { bigText, group, itemPic, stage, tenFrame } from "./views";
import type { Choice, Lesson, LessonStep, Question, Skill } from "./types";

const COLORS: Record<string, string> = {
  red: "#e53935", blue: "#1e88e5", green: "#43a047", yellow: "#fdd835", orange: "#fb8c00",
  purple: "#8e24aa", pink: "#f06292", black: "#37373f", white: "#fafafa", brown: "#8d6e63",
};
const BRIGHT = ["#e53935", "#1e88e5", "#43a047", "#fdd835", "#fb8c00", "#8e24aa", "#f06292"];

const rand = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));
const range = (lo: number, hi: number) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
const art = (svgText: string, cls = "") => h("span", { class: `pic art ${cls}`, html: svgText });

/** `n` distinct numbers in [lo, hi] including `answer`, close to it. */
function numberOptions(answer: number, lo: number, hi: number, n = 3): number[] {
  const opts = new Set([answer]);
  let spread = 2;
  while (opts.size < n) {
    const x = answer + rand(-spread, spread);
    if (x >= lo && x <= hi) opts.add(x);
    spread++;
  }
  return [...opts].sort((a, b) => a - b);
}

function numberChoices(answer: number, lo: number, hi: number, wrongSay?: (n: number) => string): Choice[] {
  return numberOptions(answer, lo, hi).map((n) => ({ label: String(n), view: () => bigText(String(n)), correct: n === answer, say: wrongSay?.(n) }));
}

/** Items that look good repeated in a group (single, simple pictures). */
const COUNTABLE = () => {
  const p = pool().filter((i) => !["farmer", "builder", "corn", "flag", "trafficlight"].includes(i.id));
  return p.length >= 4 ? p : ITEMS;
};

// ---------------------------------------------------------------------------
// Sentences

const HOUR_WORD = (hr: number) => (hr <= 10 ? NUMBERS[hr] : hr === 11 ? "eleven" : "twelve");

export const MSAY = {
  tapNumber: (n: number) => `Tap the number ${n}!`,
  thatsNumber: (n: number) => `That's ${n}.`,
  num: (n: number) => `${n}!`,
  howMany: (item: Item) => `How many ${plural(item.name)}?`,
  howManyThere: "How many are there?",
  tapShape: (s: string) => `Tap the ${s}!`,
  thatsShape: (s: string) => `That's ${/^[aeiou]/.test(s) ? "an" : "a"} ${s}.`,
  whichBig: "Which one is big?",
  whichSmall: "Which one is small?",
  thatBig: "That one is big!",
  thatSmall: "That one is small!",
  whatNext: "What comes next?",
  patternGoes: "The pattern keeps going!",
  tapColor: (c: string) => `Find the ${c} one!`,
  colorIs: (c: string) => `${cap(c)}!`,
  thatOneIs: (c: string) => `That one is ${c}.`,
  whichMore: "Which group has more?",
  whichFewer: "Which group has fewer?",
  moreThere: "That group has more!",
  fewerThere: "That group has fewer!",
  whichBigger: "Which number is bigger?",
  isBigger: (n: number) => `${n} is bigger!`,
  plusPics: (a: number, b: number) => `${a} plus ${b}.`,
  inAll: "How many in all?",
  plusIs: (a: number, b: number) => `${a} plus ${b} is ${a + b}!`,
  takeAway: (a: number, b: number) => `${a} take away ${b}.`,
  left: "How many are left?",
  takeAwayIs: (a: number, b: number) => `${a} take away ${b} is ${a - b}!`,
  whatPlus: (a: number, b: number) => `What is ${a} plus ${b}?`,
  whatMinus: (a: number, b: number) => `What is ${a} minus ${b}?`,
  minusIs: (a: number, b: number) => `${a} minus ${b} is ${a - b}!`,
  makes10Q: (a: number) => `${a} plus what makes 10?`,
  makes10: (a: number) => `${a} plus ${10 - a} makes 10!`,
  comesNext: "What number comes next?",
  byTens: "Count by tens. What comes next?",
  whatNumber: "What number is this?",
  tensOnes: (t: number, o: number) => `${t} ${t === 1 ? "ten" : "tens"} and ${o} ${o === 1 ? "one" : "ones"} is ${t * 10 + o}!`,
  whatTime: "What time is it?",
  itsTime: (hr: number, half: boolean) => `It's ${HOUR_WORD(hr)} ${half ? "thirty" : "o'clock"}!`,
  whichLonger: "Which one is longer?",
  whichShorter: "Which one is shorter?",
  thatLonger: "That one is longer!",
  thatShorter: "That one is shorter!",
};


// ---------------------------------------------------------------------------
// Pre-K

const shapes: Skill = {
  id: "shapes",
  grade: "prek",
  area: "math",
  title: "Shapes",
  icon: "🔺",
  intro: "Let's find shapes!",
  make: () => {
    const opts = shuffle([...SHAPES_2D]).slice(0, 3) as Shape2D[];
    const target = pickOne(opts);
    const colors = shuffle(BRIGHT);
    return {
      prompt: MSAY.tapShape(target),
      praise: SHAPE_FACTS[target],
      choices: opts.map((s, i) => ({ label: s, view: () => art(shape2d(s, colors[i])), correct: s === target, say: MSAY.thatsShape(s) })),
    };
  },
  lines: () => SHAPES_2D.flatMap((s) => [MSAY.tapShape(s), MSAY.thatsShape(s), SHAPE_FACTS[s]]),
};

const numbers10: Skill = {
  id: "numbers-10",
  grade: "prek",
  area: "math",
  title: "Numbers",
  icon: "🔢",
  intro: "Let's find numbers!",
  make: () => {
    const n = rand(0, 10);
    return { prompt: MSAY.tapNumber(n), style: "big", choices: numberChoices(n, 0, 10, MSAY.thatsNumber) };
  },
  lines: () => range(0, 10).flatMap((n) => [MSAY.tapNumber(n), MSAY.thatsNumber(n)]),
};

function countQuestion(max: number, frame: boolean): Question {
  const item = pickOne(COUNTABLE());
  const n = rand(1, max);
  return {
    prompt: frame ? MSAY.howManyThere : MSAY.howMany(item),
    show: () => stage(frame ? tenFrame(n, item) : group(item, n)),
    style: "big",
    praise: MSAY.num(n),
    choices: numberChoices(n, 1, max),
  };
}

const count10: Skill = {
  id: "count-10",
  grade: "prek",
  area: "math",
  title: "Counting",
  icon: "🧮",
  intro: "Let's count!",
  make: () => countQuestion(10, false),
  lines: () => [...ITEMS.map(MSAY.howMany), ...range(1, 10).map(MSAY.num)],
};

const bigSmall: Skill = {
  id: "big-small",
  grade: "prek",
  area: "math",
  title: "Big & Small",
  icon: "🐘",
  intro: "Big and small!",
  make: () => {
    const item = pickOne(COUNTABLE());
    const wantBig = Math.random() < 0.5;
    const sizes = shuffle(["big", "small"]);
    return {
      prompt: wantBig ? MSAY.whichBig : MSAY.whichSmall,
      praise: wantBig ? MSAY.thatBig : MSAY.thatSmall,
      choices: sizes.map((s) => ({ label: s, view: () => h("span", { class: `size-${s}` }, itemPic(item)), correct: (s === "big") === wantBig })),
    };
  },
  lines: () => [MSAY.whichBig, MSAY.whichSmall, MSAY.thatBig, MSAY.thatSmall],
};

const PATTERNS = ["AB", "AAB", "ABB", "ABC"];
const patterns: Skill = {
  id: "patterns",
  grade: "prek",
  area: "math",
  title: "Patterns",
  icon: "🔁",
  intro: "Let's finish the pattern!",
  make: () => {
    const kind = pickOne(PATTERNS);
    const items = shuffle(COUNTABLE()).slice(0, 3);
    const unit = kind.split("").map((c) => items[c.charCodeAt(0) - 65]);
    const seq: Item[] = [];
    while (seq.length < 7) seq.push(...unit);
    const shown = seq.slice(0, Math.max(5, unit.length * 2 + 1));
    const answer = seq[shown.length];
    const opts = shuffle([...new Set([answer, ...items])]).slice(0, 3);
    if (!opts.includes(answer)) opts[0] = answer;
    return {
      prompt: MSAY.whatNext,
      praise: MSAY.patternGoes,
      show: () => stage(h("div", { class: "pattern-row" }, ...shown.map((i) => h("span", { class: "group-item" }, itemPic(i))), h("span", { class: "pattern-q" }, "?"))),
      choices: shuffle(opts).map((i) => ({ label: i.name, view: () => itemPic(i), correct: i === answer })),
    };
  },
  lines: () => [MSAY.whatNext, MSAY.patternGoes],
};

const colors: Skill = {
  id: "colors",
  grade: "prek",
  area: "world",
  title: "Colors",
  icon: "🎨",
  intro: "Let's find colors!",
  make: () => {
    const opts = shuffle(COLOR_NAMES).slice(0, 3);
    const target = pickOne(opts);
    const shape = pickOne([...SHAPES_2D]);
    return {
      prompt: MSAY.tapColor(target),
      praise: MSAY.colorIs(target),
      choices: opts.map((c) => ({ label: c, view: () => art(shape2d(shape, COLORS[c])), correct: c === target, say: MSAY.thatOneIs(c) })),
    };
  },
  lines: () => COLOR_NAMES.flatMap((c) => [MSAY.tapColor(c), MSAY.colorIs(c), MSAY.thatOneIs(c)]),
};

// ---------------------------------------------------------------------------
// Kindergarten

const numbers20: Skill = {
  id: "numbers-20",
  grade: "k",
  area: "math",
  title: "Numbers to 20",
  icon: "🔢",
  intro: "Let's find numbers up to 20!",
  make: () => {
    const n = rand(0, 20);
    return { prompt: MSAY.tapNumber(n), style: "big", choices: numberChoices(n, 0, 20, MSAY.thatsNumber) };
  },
  lines: () => range(0, 20).flatMap((n) => [MSAY.tapNumber(n), MSAY.thatsNumber(n)]),
};

const count20: Skill = {
  id: "count-20",
  grade: "k",
  area: "math",
  title: "Count to 20",
  icon: "🧮",
  intro: "Let's count with ten frames!",
  make: () => countQuestion(20, true),
  lines: () => [MSAY.howManyThere, ...range(1, 20).map(MSAY.num)],
};

const moreFewer: Skill = {
  id: "more-fewer",
  grade: "k",
  area: "math",
  title: "More or Fewer",
  icon: "⚖️",
  intro: "Which group has more?",
  make: () => {
    const item = pickOne(COUNTABLE());
    const a = rand(1, 8);
    let b = rand(1, 8);
    while (Math.abs(a - b) < 2) b = rand(1, 9);
    const wantMore = Math.random() < 0.6;
    return {
      prompt: wantMore ? MSAY.whichMore : MSAY.whichFewer,
      praise: wantMore ? MSAY.moreThere : MSAY.fewerThere,
      choices: [a, b].map((n) => ({ label: `${n}`, view: () => group(item, n, "in-choice"), correct: wantMore ? n === Math.max(a, b) : n === Math.min(a, b) })),
    };
  },
  lines: () => [MSAY.whichMore, MSAY.whichFewer, MSAY.moreThere, MSAY.fewerThere],
};

function compareSkill(id: string, grade: "k" | "g1", lo: number, hi: number, title: string): Skill {
  return {
    id,
    grade,
    area: "math",
    title,
    icon: "🐊",
    intro: "Which number is bigger?",
    make: () => {
      const a = rand(lo, hi);
      let b = rand(lo, hi);
      while (b === a) b = rand(lo, hi);
      const big = Math.max(a, b);
      return {
        prompt: MSAY.whichBigger,
        style: "big",
        praise: MSAY.isBigger(big),
        choices: [a, b].map((n) => ({ label: String(n), view: () => bigText(String(n)), correct: n === big })),
      };
    },
    lines: () => [MSAY.whichBigger, ...range(lo + 1, hi).map(MSAY.isBigger)],
  };
}

function addPicsQuestion(): Question {
  const item = pickOne(COUNTABLE());
  const a = rand(1, 6);
  const b = rand(1, Math.min(4, 10 - a));
  return {
    prompt: `${MSAY.plusPics(a, b)} ${MSAY.inAll}`,
    show: () => stage(h("div", { class: "add-row" }, group(item, a), h("span", { class: "op" }, "+"), b ? group(item, b) : h("span", { class: "op" }, "0"))),
    style: "big",
    praise: MSAY.plusIs(a, b),
    choices: numberChoices(a + b, 0, 10),
  };
}

const add10: Skill = {
  id: "add-10",
  grade: "k",
  area: "math",
  title: "Adding",
  icon: "➕",
  intro: "Adding means putting together!",
  make: addPicsQuestion,
  lines: () => {
    const out = [MSAY.inAll];
    for (let a = 0; a <= 10; a++) for (let b = 0; a + b <= 10; b++) out.push(MSAY.plusPics(a, b), MSAY.plusIs(a, b));
    return out;
  },
};

function subPicsQuestion(): Question {
  const item = pickOne(COUNTABLE());
  const a = rand(2, 10);
  const b = rand(1, Math.min(5, a));
  return {
    prompt: `${MSAY.takeAway(a, b)} ${MSAY.left}`,
    show: () =>
      stage(
        h(
          "div",
          { class: "group" },
          ...Array.from({ length: a }, (_, i) => h("span", { class: `group-item${i >= a - b ? " gone" : ""}` }, itemPic(item))),
        ),
      ),
    style: "big",
    praise: MSAY.takeAwayIs(a, b),
    choices: numberChoices(a - b, 0, 10),
  };
}

const sub10: Skill = {
  id: "sub-10",
  grade: "k",
  area: "math",
  title: "Take Away",
  icon: "➖",
  intro: "Taking away means some go away!",
  make: subPicsQuestion,
  lines: () => {
    const out = [MSAY.left];
    for (let a = 0; a <= 10; a++) for (let b = 0; b <= a; b++) out.push(MSAY.takeAway(a, b), MSAY.takeAwayIs(a, b));
    return out;
  },
};

const shapes3d: Skill = {
  id: "shapes-3d",
  grade: "k",
  area: "math",
  title: "3D Shapes",
  icon: "🧊",
  intro: "Let's find solid shapes!",
  make: () => {
    const opts = shuffle([...SOLIDS]).slice(0, 3) as Solid[];
    const target = pickOne(opts);
    const colors = shuffle(BRIGHT);
    return {
      prompt: MSAY.tapShape(target),
      praise: SOLID_FACTS[target],
      choices: opts.map((s, i) => ({ label: s, view: () => art(solid(s, colors[i])), correct: s === target, say: MSAY.thatsShape(s) })),
    };
  },
  lines: () => SOLIDS.flatMap((s) => [MSAY.tapShape(s), MSAY.thatsShape(s), SOLID_FACTS[s]]),
};

// ---------------------------------------------------------------------------
// 1st grade

function equationShow(text: string, a?: number, b?: number) {
  return () => stage(h("div", { class: "equation" }, text), a !== undefined && b !== undefined && a + b <= 20 ? h("div", { class: "eq-frames" }, tenFrameTwo(a, b)) : "");
}

/** Ten frames with `a` red counters then `b` blue ones. */
function tenFrameTwo(a: number, b: number): HTMLElement {
  const el = tenFrame(a + b);
  el.querySelectorAll(".tf-cell.on .dot").forEach((d, i) => i >= a && d.classList.add("b"));
  return el;
}

const add20: Skill = {
  id: "add-20",
  grade: "g1",
  area: "math",
  title: "Adding to 20",
  icon: "➕",
  intro: "Let's add!",
  make: () => {
    const a = rand(2, 12);
    const b = rand(1, 20 - a > 9 ? 9 : 20 - a);
    return { prompt: MSAY.whatPlus(a, b), style: "big", show: equationShow(`${a} + ${b} = ?`, a, b), praise: MSAY.plusIs(a, b), choices: numberChoices(a + b, 0, 20) };
  },
  lines: () => {
    const out: string[] = [];
    for (let a = 0; a <= 20; a++) for (let b = 0; a + b <= 20; b++) out.push(MSAY.whatPlus(a, b), MSAY.plusIs(a, b));
    return out;
  },
};

const sub20: Skill = {
  id: "sub-20",
  grade: "g1",
  area: "math",
  title: "Subtracting",
  icon: "➖",
  intro: "Let's subtract!",
  make: () => {
    const a = rand(5, 20);
    const b = rand(1, Math.min(10, a));
    return { prompt: MSAY.whatMinus(a, b), style: "big", show: () => stage(h("div", { class: "equation" }, `${a} − ${b} = ?`)), praise: MSAY.minusIs(a, b), choices: numberChoices(a - b, 0, 20) };
  },
  lines: () => {
    const out: string[] = [];
    for (let a = 0; a <= 20; a++) for (let b = 0; b <= a; b++) out.push(MSAY.whatMinus(a, b), MSAY.minusIs(a, b));
    return out;
  },
};

const make10: Skill = {
  id: "make-10",
  grade: "g1",
  area: "math",
  title: "Make 10",
  icon: "🔟",
  intro: "Let's make ten!",
  make: () => {
    const a = rand(0, 10);
    return { prompt: MSAY.makes10Q(a), style: "big", show: () => stage(tenFrame(a)), praise: MSAY.makes10(a), choices: numberChoices(10 - a, 0, 10) };
  },
  lines: () => range(0, 10).flatMap((a) => [MSAY.makes10Q(a), MSAY.makes10(a)]),
};

const count120: Skill = {
  id: "count-120",
  grade: "g1",
  area: "math",
  title: "Count to 120",
  icon: "💯",
  intro: "Let's count up to 120!",
  make: () => {
    const tens = Math.random() < 0.25;
    if (tens) {
      const start = rand(1, 8) * 10;
      const seq = [start, start + 10, start + 20];
      const ans = start + 30;
      return {
        prompt: MSAY.byTens,
        style: "big",
        show: () => stage(h("div", { class: "seq" }, `${seq.join(", ")}, ?`)),
        praise: MSAY.num(ans),
        choices: shuffle([ans, ans - 1, ans + 10].filter((x, i, arr) => arr.indexOf(x) === i)).map((n) => ({ label: String(n), view: () => bigText(String(n)), correct: n === ans })),
      };
    }
    const start = rand(1, 117);
    const ans = start + 2;
    return {
      prompt: MSAY.comesNext,
      style: "big",
      show: () => stage(h("div", { class: "seq" }, `${start}, ${start + 1}, ?`)),
      praise: MSAY.num(ans),
      choices: numberChoices(ans, 1, 120),
    };
  },
  lines: () => [MSAY.comesNext, MSAY.byTens, ...range(1, 120).map(MSAY.num)],
};

const placeValue: Skill = {
  id: "place-value",
  grade: "g1",
  area: "math",
  title: "Tens & Ones",
  icon: "🧱",
  intro: "Tens and ones! Each tall block is ten.",
  make: () => {
    const t = rand(1, 9);
    const o = rand(0, 9);
    const n = t * 10 + o;
    const opts = shuffle([...new Set([n, o * 10 + t, n + 10 > 99 ? n - 10 : n + 10])].filter((x) => x > 0 && x < 100)).slice(0, 3);
    while (opts.length < 3) {
      const x = rand(10, 99);
      if (!opts.includes(x)) opts.push(x);
    }
    return {
      prompt: MSAY.whatNumber,
      style: "big",
      show: () => stage(art(baseTen(t, o), "blocks")),
      praise: MSAY.tensOnes(t, o),
      choices: shuffle(opts).map((x) => ({ label: String(x), view: () => bigText(String(x)), correct: x === n })),
    };
  },
  lines: () => {
    const out = [MSAY.whatNumber];
    for (let t = 0; t <= 9; t++) for (let o = 0; o <= 9; o++) out.push(MSAY.tensOnes(t, o));
    return out;
  },
};

const timeSkill: Skill = {
  id: "time",
  grade: "g1",
  area: "math",
  title: "Telling Time",
  icon: "🕒",
  intro: "Let's tell time! The short hand shows the hour.",
  make: () => {
    const hr = rand(1, 12);
    const half = Math.random() < 0.4;
    const fmt = (x: number, hf: boolean) => `${x}:${hf ? "30" : "00"}`;
    const other = ((hr + rand(1, 10)) % 12) + 1;
    const opts = shuffle([
      { hr, half },
      { hr, half: !half },
      { hr: other, half },
    ]);
    return {
      prompt: MSAY.whatTime,
      style: "big",
      show: () => stage(art(clockFace(hr, half ? 30 : 0), "clock")),
      praise: MSAY.itsTime(hr, half),
      choices: opts.map((o) => ({ label: fmt(o.hr, o.half), view: () => bigText(fmt(o.hr, o.half), "time"), correct: o.hr === hr && o.half === half })),
    };
  },
  lines: () => [MSAY.whatTime, ...range(1, 12).flatMap((hr) => [MSAY.itsTime(hr, false), MSAY.itsTime(hr, true)])],
};

const lengthSkill: Skill = {
  id: "length",
  grade: "g1",
  area: "math",
  title: "Longer & Shorter",
  icon: "📏",
  intro: "Which one is longer?",
  make: () => {
    const wantLong = Math.random() < 0.5;
    const a = 0.3 + Math.random() * 0.2;
    const b = a + 0.25 + Math.random() * 0.25;
    const cols = shuffle(BRIGHT);
    const opts = shuffle([a, b]);
    return {
      prompt: wantLong ? MSAY.whichLonger : MSAY.whichShorter,
      praise: wantLong ? MSAY.thatLonger : MSAY.thatShorter,
      style: "words",
      choices: opts.map((len, i) => ({ label: len === b ? "long" : "short", view: () => art(crayon(len, cols[i]), "crayon"), correct: (len === b) === wantLong })),
    };
  },
  lines: () => [MSAY.whichLonger, MSAY.whichShorter, MSAY.thatLonger, MSAY.thatShorter],
};

export const MATH_SKILLS: Skill[] = [
  numbers10, count10, shapes, colors, bigSmall, patterns,
  numbers20, count20, moreFewer, compareSkill("compare-10", "k", 0, 10, "Bigger Number"), add10, sub10, shapes3d,
  add20, sub20, make10, count120, placeValue, compareSkill("compare-100", "g1", 10, 120, "Compare Numbers"), timeSkill, lengthSkill,
];

// ---------------------------------------------------------------------------
// Lessons

const L = {
  numberIs: (n: number) => `This is the number ${n}.`,
  countUp: (n: number) => range(1, n).map((k) => `${cap(NUMBERS[k])}!`).join(" "),
  shapeIs: (s: string) => `This is ${/^[aeiou]/.test(s) ? "an" : "a"} ${s}.`,
  addIntro: "When we add, we put things together.",
  addEx: (a: number, b: number) => `${a} trucks and ${b} more trucks.`,
  addTotal: (a: number, b: number) => `That makes ${a + b} trucks!`,
  subIntro: "When we take away, some things go away.",
  subEx: (a: number, b: number) => `${a} dinosaurs. ${b} walk away.`,
  subLeft: (a: number, b: number) => `${a - b} are left!`,
  moreIntro: "More means a bigger group. Fewer means a smaller group.",
  tenIntro: "A ten frame has ten spaces. Two rows of five.",
  teenEx: (n: number) => `${n} is one full ten and ${n - 10} more.`,
  bigSmallIntro: "Elephants are big. Mice are small.",
  patternIntro: "A pattern repeats again and again.",
  patternSay: "Car, truck, car, truck, car, truck!",
  tensIntro: "A tall block is ten. A little cube is one.",
  tensEx: (t: number, o: number) => `${t} tens and ${o} ones make ${t * 10 + o}.`,
  make10Intro: "Two numbers that make ten are friends!",
  make10Ex: (a: number) => `${a} and ${10 - a} make ten.`,
  timeIntro: "A clock has a short hand and a long hand.",
  timeHour: "The short hand points to the hour. When the long hand is on the 12, it's o'clock.",
  timeHalf: "When the long hand points to the 6, it's thirty. Half past!",
  count120Intro: "Numbers go on and on! After 100 comes 101, 102, and up to 120.",
  byTensSay: "10, 20, 30, 40, 50, 60, 70, 80, 90, 100!",
  solidIntro: "Solid shapes are not flat. You can hold them!",
};

const show = (...children: (HTMLElement | string)[]) => () => h("div", { class: "lesson-card-inner" }, ...children);
const bigN = (n: number | string) => h("div", { class: "lesson-big" }, String(n));
const truck = () => byId.get("dumptruck")!;
const dino = () => byId.get("trex")!;

function numberLesson(id: string, title: string, from: number, to: number): Lesson {
  return {
    id,
    grade: "prek",
    area: "math",
    title,
    icon: "🔢",
    steps: () => {
      const steps: LessonStep[] = [];
      for (let n = from; n <= to; n++) {
        const item = pickOne(COUNTABLE());
        steps.push({ say: `${L.numberIs(n)} ${L.countUp(n)}`, show: show(bigN(n), group(item, n)) });
      }
      steps.push({
        practice: "numbers-10",
        count: 3,
        make: () => {
          const n = rand(from, to);
          return { prompt: MSAY.tapNumber(n), style: "big", choices: numberChoices(n, Math.max(0, from - 1), to + 1, MSAY.thatsNumber) };
        },
      });
      steps.push({ practice: "count-10", count: 2, make: () => countQuestion(to, false) });
      return steps;
    },
    lines: () => range(from, to).map((n) => `${L.numberIs(n)} ${L.countUp(n)}`),
  };
}

const shapeLesson: Lesson = {
  id: "lesson-shapes",
  grade: "prek",
  area: "math",
  title: "Shapes",
  icon: "🔺",
  steps: () => [
    ...SHAPES_2D.slice(0, 6).map((s, i) => ({ say: `${L.shapeIs(s)} ${SHAPE_FACTS[s]}`, show: show(h("div", { class: "lesson-pic" }, art(shape2d(s, BRIGHT[i % BRIGHT.length])))) })),
    { practice: "shapes", count: 4 },
  ],
  lines: () => SHAPES_2D.map((s) => `${L.shapeIs(s)} ${SHAPE_FACTS[s]}`),
};

const bigSmallLesson: Lesson = {
  id: "lesson-big-small",
  grade: "prek",
  area: "math",
  title: "Big & Small",
  icon: "🐘",
  steps: () => [
    { say: L.bigSmallIntro, show: show(h("div", { class: "add-row" }, h("span", { class: "lesson-pic" }, itemPic(byId.get("elephant")!)), h("span", { class: "size-small" }, h("span", { class: "pic emoji" }, "🐭")))) },
    { practice: "big-small", count: 4 },
  ],
  lines: () => [L.bigSmallIntro],
};

const patternLesson: Lesson = {
  id: "lesson-patterns",
  grade: "prek",
  area: "math",
  title: "Patterns",
  icon: "🔁",
  steps: () => {
    const car = byId.get("car")!;
    const tr = byId.get("delivery")!;
    return [
      { say: `${L.patternIntro} ${L.patternSay}`, show: show(h("div", { class: "pattern-row" }, ...[car, tr, car, tr, car, tr].map((i) => h("span", { class: "group-item" }, itemPic(i))))) },
      { practice: "patterns", count: 4 },
    ];
  },
  lines: () => [`${L.patternIntro} ${L.patternSay}`],
};

const tenFrameLesson: Lesson = {
  id: "lesson-ten-frames",
  grade: "k",
  area: "math",
  title: "Ten Frames",
  icon: "🧮",
  steps: () => [
    { say: L.tenIntro, show: show(tenFrame(10, truck())) },
    { say: L.teenEx(13), show: show(bigN(13), tenFrame(13, truck())) },
    { say: L.teenEx(17), show: show(bigN(17), tenFrame(17, dino())) },
    { practice: "count-20", count: 4 },
  ],
  lines: () => [L.tenIntro, L.teenEx(13), L.teenEx(17)],
};

const addLesson: Lesson = {
  id: "lesson-adding",
  grade: "k",
  area: "math",
  title: "Adding",
  icon: "➕",
  steps: () => [
    { say: L.addIntro, show: show(h("div", { class: "lesson-big" }, "+")) },
    { say: `${L.addEx(2, 3)} ${L.addTotal(2, 3)}`, show: show(h("div", { class: "add-row" }, group(truck(), 2), h("span", { class: "op" }, "+"), group(truck(), 3)), h("div", { class: "equation" }, "2 + 3 = 5")) },
    { say: `${L.addEx(4, 1)} ${L.addTotal(4, 1)}`, show: show(h("div", { class: "add-row" }, group(truck(), 4), h("span", { class: "op" }, "+"), group(truck(), 1)), h("div", { class: "equation" }, "4 + 1 = 5")) },
    { practice: "add-10", count: 4 },
  ],
  lines: () => [L.addIntro, `${L.addEx(2, 3)} ${L.addTotal(2, 3)}`, `${L.addEx(4, 1)} ${L.addTotal(4, 1)}`],
};

const subLesson: Lesson = {
  id: "lesson-take-away",
  grade: "k",
  area: "math",
  title: "Take Away",
  icon: "➖",
  steps: () => [
    { say: L.subIntro, show: show(h("div", { class: "lesson-big" }, "−")) },
    {
      say: `${L.subEx(5, 2)} ${L.subLeft(5, 2)}`,
      show: show(h("div", { class: "group" }, ...Array.from({ length: 5 }, (_, i) => h("span", { class: `group-item${i >= 3 ? " gone" : ""}` }, itemPic(dino())))), h("div", { class: "equation" }, "5 − 2 = 3")),
    },
    { practice: "sub-10", count: 4 },
  ],
  lines: () => [L.subIntro, `${L.subEx(5, 2)} ${L.subLeft(5, 2)}`],
};

const moreLesson: Lesson = {
  id: "lesson-more-fewer",
  grade: "k",
  area: "math",
  title: "More & Fewer",
  icon: "⚖️",
  steps: () => [
    { say: L.moreIntro, show: show(h("div", { class: "add-row" }, group(byId.get("cow")!, 6), h("span", { class: "op" }, " "), group(byId.get("cow")!, 2))) },
    { practice: "more-fewer", count: 4 },
  ],
  lines: () => [L.moreIntro],
};

const solidLesson: Lesson = {
  id: "lesson-solids",
  grade: "k",
  area: "math",
  title: "3D Shapes",
  icon: "🧊",
  steps: () => [
    { say: L.solidIntro, show: show(h("div", { class: "add-row" }, ...SOLIDS.slice(0, 3).map((s, i) => h("span", { class: "group-item big" }, art(solid(s, BRIGHT[i])))))) },
    ...SOLIDS.map((s, i) => ({ say: SOLID_FACTS[s], show: show(h("div", { class: "lesson-pic" }, art(solid(s, BRIGHT[(i + 2) % BRIGHT.length])))) })),
    { practice: "shapes-3d", count: 4 },
  ],
  lines: () => [L.solidIntro],
};

const tensLesson: Lesson = {
  id: "lesson-tens-ones",
  grade: "g1",
  area: "math",
  title: "Tens & Ones",
  icon: "🧱",
  steps: () => [
    { say: L.tensIntro, show: show(h("div", { class: "lesson-pic wide" }, art(baseTen(1, 1)))) },
    { say: L.tensEx(2, 4), show: show(bigN(24), art(baseTen(2, 4), "blocks")) },
    { say: L.tensEx(5, 7), show: show(bigN(57), art(baseTen(5, 7), "blocks")) },
    { practice: "place-value", count: 4 },
  ],
  lines: () => [L.tensIntro, L.tensEx(2, 4), L.tensEx(5, 7)],
};

const make10Lesson: Lesson = {
  id: "lesson-make-10",
  grade: "g1",
  area: "math",
  title: "Make 10",
  icon: "🔟",
  steps: () => [
    { say: L.make10Intro, show: show(tenFrameTwo(7, 3)) },
    { say: L.make10Ex(7), show: show(h("div", { class: "equation" }, "7 + 3 = 10"), tenFrameTwo(7, 3)) },
    { say: L.make10Ex(4), show: show(h("div", { class: "equation" }, "4 + 6 = 10"), tenFrameTwo(4, 6)) },
    { practice: "make-10", count: 4 },
  ],
  lines: () => [L.make10Intro, L.make10Ex(7), L.make10Ex(4)],
};

const timeLesson: Lesson = {
  id: "lesson-time",
  grade: "g1",
  area: "math",
  title: "Telling Time",
  icon: "🕒",
  steps: () => [
    { say: L.timeIntro, show: show(h("div", { class: "lesson-pic" }, art(clockFace(3, 0)))) },
    { say: `${L.timeHour} ${MSAY.itsTime(3, false)}`, show: show(h("div", { class: "lesson-pic" }, art(clockFace(3, 0))), bigN("3:00")) },
    { say: `${L.timeHalf} ${MSAY.itsTime(3, true)}`, show: show(h("div", { class: "lesson-pic" }, art(clockFace(3, 30))), bigN("3:30")) },
    { practice: "time", count: 4 },
  ],
  lines: () => [L.timeIntro, `${L.timeHour} ${MSAY.itsTime(3, false)}`, `${L.timeHalf} ${MSAY.itsTime(3, true)}`],
};

const count120Lesson: Lesson = {
  id: "lesson-count-120",
  grade: "g1",
  area: "math",
  title: "Counting to 120",
  icon: "💯",
  steps: () => [
    { say: L.byTensSay, show: show(h("div", { class: "seq" }, "10, 20, 30, 40, 50, 60, 70, 80, 90, 100")) },
    { say: L.count120Intro, show: show(h("div", { class: "seq" }, "99, 100, 101, 102 … 120")) },
    { practice: "count-120", count: 4 },
  ],
  lines: () => [L.byTensSay, L.count120Intro],
};

export const MATH_LESSONS: Lesson[] = [
  numberLesson("lesson-numbers-1-5", "Numbers 1 to 5", 1, 5),
  numberLesson("lesson-numbers-6-10", "Numbers 6 to 10", 6, 10),
  shapeLesson,
  bigSmallLesson,
  patternLesson,
  tenFrameLesson,
  addLesson,
  subLesson,
  moreLesson,
  solidLesson,
  tensLesson,
  make10Lesson,
  timeLesson,
  count120Lesson,
];
