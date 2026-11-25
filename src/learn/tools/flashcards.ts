/**
 * Flashcards: letters, numbers, sight words and shapes. Tap the card to hear
 * it; swipe (or use the arrows) for the next one; shuffle the deck.
 */
import { sfx } from "../../lib/sfx";
import { speak } from "../../lib/speech";
import { bounce, h, shuffle } from "../../lib/ui";
import { grade } from "../progress";
import type { Tool } from "../types";
import { SIGHT_G1, SIGHT_K } from "../words";
import { boxVars, cap, on, sayNumber, toolBtn, UPPER } from "./common";

interface Card {
  key: string;
  say: string;
  view: () => HTMLElement;
}

interface Deck {
  id: string;
  say: string;
  label: string;
  chip: () => HTMLElement;
  cards: () => Card[];
}

const SHAPES: { name: string; color: string; svg: string }[] = [
  { name: "circle", color: "#e53935", svg: `<circle cx="50" cy="50" r="42"/>` },
  { name: "square", color: "#1e88e5", svg: `<rect x="10" y="10" width="80" height="80" rx="4"/>` },
  { name: "triangle", color: "#43a047", svg: `<polygon points="50,8 94,88 6,88" stroke-linejoin="round"/>` },
  { name: "rectangle", color: "#fb8c00", svg: `<rect x="4" y="24" width="92" height="52" rx="4"/>` },
  { name: "oval", color: "#8e24aa", svg: `<ellipse cx="50" cy="50" rx="44" ry="30"/>` },
  { name: "star", color: "#fdd835", svg: `<polygon points="50,5 61,38 96,38 68,59 78,93 50,72 22,93 32,59 4,38 39,38" stroke-linejoin="round"/>` },
  { name: "heart", color: "#ec407a", svg: `<path d="M50 90 C 20 68 4 50 4 32 C 4 16 16 6 29 6 C 39 6 46 12 50 20 C 54 12 61 6 71 6 C 84 6 96 16 96 32 C 96 50 80 68 50 90 Z"/>` },
  { name: "diamond", color: "#00acc1", svg: `<polygon points="50,4 90,50 50,96 10,50" stroke-linejoin="round"/>` },
];

const shapeSvg = (sh: (typeof SHAPES)[number], cls = "") =>
  h("span", {
    class: `t-shape ${cls}`,
    html: `<svg viewBox="0 0 100 100" aria-hidden="true" fill="${sh.color}" stroke="rgba(0,0,0,.18)" stroke-width="3">${sh.svg}</svg>`,
  });

const sayWord = (w: string) => `${cap(w)}!`;

function dots(n: number): HTMLElement {
  const frames = n > 10 ? 2 : 1;
  return h(
    "div",
    { class: "t-fc-dots", "aria-hidden": "true" },
    ...Array.from({ length: frames }, (_, f) =>
      h("div", { class: "t-fc-frame" }, ...Array.from({ length: 10 }, (_, i) => h("i", { class: f * 10 + i < n ? "on" : "" }))),
    ),
  );
}

const DECKS: Deck[] = [
  {
    id: "letters",
    say: "Letters!",
    label: "Letters",
    chip: () => h("span", { class: "t-chip-txt" }, "ABC"),
    cards: () => UPPER.map((L) => ({ key: L, say: `${L}!`, view: () => h("div", { class: "t-fc-letter" }, L, h("span", { class: "lower" }, L.toLowerCase())) })),
  },
  {
    id: "numbers",
    say: "Numbers!",
    label: "Numbers",
    chip: () => h("span", { class: "t-chip-txt" }, "123"),
    cards: () =>
      Array.from({ length: 21 }, (_, n) => ({
        key: String(n),
        say: sayNumber(n),
        view: () => h("div", { class: "t-fc-number" }, h("div", { class: "digit" }, String(n)), dots(n)),
      })),
  },
  {
    id: "sightk",
    say: "Sight words!",
    label: "Kindergarten sight words",
    chip: () => h("span", { class: "t-chip-txt word" }, "the", h("b", {}, "K")),
    cards: () => SIGHT_K.map(wordCard),
  },
  {
    id: "sight1",
    say: "Sight words!",
    label: "First grade sight words",
    chip: () => h("span", { class: "t-chip-txt word" }, "of", h("b", {}, "1st")),
    cards: () => SIGHT_G1.map(wordCard),
  },
  {
    id: "shapes",
    say: "Shapes!",
    label: "Shapes",
    chip: () => h("span", { class: "t-chip-shapes" }, shapeSvg(SHAPES[2]), shapeSvg(SHAPES[0])),
    cards: () => SHAPES.map((sh) => ({ key: sh.name, say: sayWord(sh.name), view: () => h("div", { class: "t-fc-shape" }, shapeSvg(sh)) })),
  },
];

function wordCard(w: string): Card {
  return { key: w, say: sayWord(w), view: () => h("div", { class: "t-fc-word", style: `--len:${w.length}` }, w) };
}

const SAY = {
  intro: "Tap the card to hear it. Swipe to see the next one!",
};

export const flashcards: Tool = {
  id: "flashcards",
  grades: ["prek", "k", "g1"],
  title: "Flashcards",
  icon: "🃏",
  lines() {
    const out = [SAY.intro, ...DECKS.map((d) => d.say)];
    for (const d of DECKS) for (const c of d.cards()) out.push(c.say);
    return out;
  },
  start(scene) {
    const { root, signal } = scene;
    const g = grade();
    let deck = DECKS.find((d) => d.id === (g === "g1" ? "sight1" : g === "k" ? "sightk" : "letters"))!;
    // Pre-K starts on letters, K and 1st on their sight words — any deck is a tap away.
    let cards = deck.cards();
    let at = 0;

    const face = h("div", { class: "t-fc-face" });
    const card = h("button", { class: "t-fc-card", "aria-label": "Card. Tap to hear it." }, face);
    const progressBar = h("i");
    const progressEl = h("div", { class: "t-fc-progress", "aria-hidden": "true" }, progressBar);

    const deckBtns = DECKS.map((d) =>
      h(
        "button",
        {
          class: `t-chip t-deck${d === deck ? " on" : ""}`,
          "aria-label": d.label,
          onclick: (e: MouseEvent) => {
            deck = d;
            cards = d.cards();
            at = 0;
            deckBtns.forEach((b) => b.classList.toggle("on", b === e.currentTarget));
            bounce(e.currentTarget as Element);
            sfx.tap();
            show(0);
            void speak(d.say);
          },
        },
        d.chip(),
      ),
    );

    const box = h("div", { class: "t-fc-box" }, card);
    root.replaceChildren(
      h(
        "div",
        { class: "t-wrap t-flash" },
        h("div", { class: "t-chips t-decks", role: "group", "aria-label": "Pick a deck" }, ...deckBtns),
        box,
        progressEl,
        h(
          "div",
          { class: "t-bar-row t-fc-nav" },
          toolBtn("⬅️", "Back", () => go(-1)),
          toolBtn("🔀", "Shuffle", () => {
            sfx.whoosh();
            cards = shuffle(cards);
            at = 0;
            show(1);
          }),
          toolBtn("➡️", "Next", () => go(1)),
        ),
      ),
    );

    boxVars(box, signal);

    function show(dir: number) {
      const c = cards[at];
      face.replaceChildren(c.view());
      card.setAttribute("aria-label", `${c.key}. Tap to hear it.`);
      progressBar.style.width = `${((at + 1) / cards.length) * 100}%`;
      card.classList.remove("in-left", "in-right", "in-pop");
      void card.offsetWidth;
      card.classList.add(dir > 0 ? "in-right" : dir < 0 ? "in-left" : "in-pop");
    }

    function go(d: number) {
      at = (at + d + cards.length) % cards.length;
      sfx.tap();
      show(d);
    }

    // Tap to hear; swipe to move.
    let startX = 0;
    let startY = 0;
    let dx = 0;
    let down = false;
    let swiped = false;
    on(
      card,
      "pointerdown",
      (e: PointerEvent) => {
        down = true;
        swiped = false;
        startX = e.clientX;
        startY = e.clientY;
        dx = 0;
        try {
          card.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      },
      signal,
    );
    on(
      card,
      "pointermove",
      (e: PointerEvent) => {
        if (!down) return;
        dx = e.clientX - startX;
        if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(e.clientY - startY)) {
          card.style.transform = `translateX(${dx}px) rotate(${dx / 30}deg)`;
        }
      },
      signal,
    );
    const end = () => {
      if (!down) return;
      down = false;
      card.style.transform = "";
      if (Math.abs(dx) > 60) {
        swiped = true;
        go(dx < 0 ? 1 : -1);
      }
    };
    on(card, "pointerup", end, signal);
    on(card, "pointercancel", end, signal);
    on(
      card,
      "click",
      () => {
        if (swiped) {
          swiped = false;
          return;
        }
        bounce(face);
        void speak(cards[at].say);
      },
      signal,
    );
    on(
      document,
      "keydown",
      (e: KeyboardEvent) => {
        if (e.key === "ArrowRight") go(1);
        else if (e.key === "ArrowLeft") go(-1);
      },
      signal,
    );

    show(0);
    void speak(SAY.intro);
  },
};

