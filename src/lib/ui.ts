import { ART } from "../art/art";
import PICS from "../data/pics.json";
import { byId, ITEMS, itemsFor, type Item } from "../data/items";
import { sfx } from "./sfx";
import { speak } from "./speech";
import { progress, saveProgress, settings } from "./store";
import { line } from "../voice/lines";

type Child = Node | string | number | false | null | undefined;
type Props = Record<string, any> & { class?: string; style?: string };

/** Tiny hyperscript helper: h("button", { class: "big", onclick }, "Hi"). */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, props: Props = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k.startsWith("on") && typeof v === "function") {
      el.addEventListener(k.slice(2), v);
    } else if (k === "class") {
      el.className = v;
    } else if (k === "html") {
      el.innerHTML = v;
    } else {
      el.setAttribute(k, v === true ? "" : String(v));
    }
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

const PIC_BY_GLYPH = PICS as Record<string, string>;
const picFor = (glyph: string) => PIC_BY_GLYPH[glyph.replace(/\uFE0F/g, "")];

/**
 * The picture for an item: our SVG art if we drew one, else its Fluent Emoji
 * picture (public/pics/), else the device's emoji.
 */
export function pic(item: Item, cls = ""): HTMLElement {
  if (item.art && ART[item.art]) {
    return h("span", { class: `pic art ${cls}`, html: ART[item.art], "aria-hidden": "true" });
  }
  const file = item.emoji && picFor(item.emoji);
  if (file) {
    return h("span", { class: `pic art ${cls}`, "aria-hidden": "true" }, h("img", { src: `/pics/${file}.webp`, alt: "", draggable: "false", decoding: "async" }));
  }
  return h("span", { class: `pic emoji ${cls}`, "aria-hidden": "true" }, item.emoji ?? "❓");
}

/** An emoji-sized icon: the Fluent picture for this emoji when we have it. */
export function icon(glyph: string, cls = ""): HTMLElement {
  const file = picFor(glyph);
  if (file) return h("img", { class: `ico ${cls}`, src: `/pics/${file}.webp`, alt: "", draggable: "false", "aria-hidden": "true" });
  return h("span", { class: `ico-emoji ${cls}`, "aria-hidden": "true" }, glyph);
}

/** Lay out a .choice-grid for n pictures in both orientations. */
export function choiceGrid(grid: HTMLElement, n: number) {
  const pc = n <= 4 ? Math.min(n, 2) : 3;
  const lc = n <= 4 ? n : 3;
  grid.style.setProperty("--pc", String(pc));
  grid.style.setProperty("--pr", String(Math.ceil(n / pc)));
  grid.style.setProperty("--lc", String(lc));
  grid.style.setProperty("--lr", String(Math.ceil(n / lc)));
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function wait(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

/** The items for the grown-up's chosen themes. */
export function pool(): Item[] {
  const items = itemsFor(settings.themes);
  return items.length >= 4 ? items : ITEMS;
}

/**
 * Picks the next item without repeating recent ones, so the same truck doesn't
 * come up three times in a row.
 */
export function makeDeck<T>(getItems: () => T[], memory = 6) {
  const recent: T[] = [];
  return () => {
    const items = getItems();
    const fresh = items.filter((i) => !recent.includes(i));
    const choice = pickOne(fresh.length ? fresh : items);
    recent.push(choice);
    if (recent.length > Math.min(memory, items.length - 1)) recent.shift();
    return choice;
  };
}

// ---------------------------------------------------------------------------
// Celebrations

const CONFETTI_COLORS = ["#ff5252", "#ffd740", "#69f0ae", "#40c4ff", "#e040fb", "#ff9100"];

export function confetti(count = 40, origin?: { x: number; y: number }) {
  const layer = h("div", { class: "confetti-layer", "aria-hidden": "true" });
  document.body.append(layer);
  const ox = origin?.x ?? window.innerWidth / 2;
  const oy = origin?.y ?? window.innerHeight / 2;
  for (let i = 0; i < count; i++) {
    const p = h("i", { class: "confetti" });
    const angle = Math.random() * Math.PI * 2;
    const dist = 120 + Math.random() * Math.min(window.innerWidth, 500) * 0.6;
    p.style.left = `${ox}px`;
    p.style.top = `${oy}px`;
    p.style.background = pickOne(CONFETTI_COLORS);
    p.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    p.style.setProperty("--dy", `${Math.sin(angle) * dist - 80}px`);
    p.style.setProperty("--r", `${Math.random() * 720 - 360}deg`);
    p.style.animationDelay = `${Math.random() * 80}ms`;
    layer.append(p);
  }
  setTimeout(() => layer.remove(), 1600);
}

function centerOf(el?: Element | null) {
  if (!el) return undefined;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

const STARS_PER_STICKER = 5;

/**
 * A correct answer! Confetti, a star, and every few stars a new sticker.
 * Resolves after any sticker celebration finishes.
 */
export async function reward(from?: Element | null): Promise<void> {
  sfx.correct();
  confetti(36, centerOf(from));
  progress.stars++;
  saveProgress();
  updateStarCount();
  flyStar(from);
  if (progress.stars % STARS_PER_STICKER === 0) {
    await wait(700);
    await stickerPopup();
  }
}

function flyStar(from?: Element | null) {
  const start = centerOf(from) ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const target = document.querySelector(".star-count");
  const end = centerOf(target) ?? { x: window.innerWidth - 40, y: 30 };
  const s = h("div", { class: "flying-star", "aria-hidden": "true" }, icon("⭐"));
  s.style.left = `${start.x}px`;
  s.style.top = `${start.y}px`;
  s.style.setProperty("--dx", `${end.x - start.x}px`);
  s.style.setProperty("--dy", `${end.y - start.y}px`);
  document.body.append(s);
  setTimeout(() => {
    s.remove();
    target?.classList.remove("bump");
    void (target as HTMLElement | null)?.offsetWidth;
    target?.classList.add("bump");
  }, 900);
}

export function updateStarCount() {
  document.querySelectorAll(".star-count .n").forEach((n) => (n.textContent = String(progress.stars)));
}

async function stickerPopup() {
  const owned = new Set(progress.stickers);
  const notOwned = ITEMS.filter((i) => !owned.has(i.id));
  const themed = pool().filter((i) => !owned.has(i.id));
  const item = pickOne(themed.length ? themed : notOwned.length ? notOwned : ITEMS);
  if (!owned.has(item.id)) progress.stickers.push(item.id);
  saveProgress();

  return new Promise<void>((resolve) => {
    const close = () => {
      overlay.classList.add("leaving");
      setTimeout(() => overlay.remove(), 250);
      resolve();
    };
    const overlay = h(
      "div",
      { class: "overlay sticker-pop", role: "dialog", "aria-label": "New sticker" },
      h(
        "button",
        { class: "sticker-card", onclick: close, "aria-label": `New sticker: ${item.name}. Tap to keep playing.` },
        h("div", { class: "sticker-burst", "aria-hidden": "true" }),
        pic(item, "sticker-pic"),
        h("div", { class: "sticker-label" }, "New sticker!"),
      ),
    );
    document.body.append(overlay);
    sfx.sticker();
    confetti(80);
    void speak(line.newSticker(item));
    setTimeout(() => close(), 6000);
  });
}

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Shake an element gently (wrong answer, but no scary noises). */
export function wiggle(el: Element) {
  el.classList.remove("wiggle");
  void (el as HTMLElement).offsetWidth;
  el.classList.add("wiggle");
  sfx.oops();
}

export function bounce(el: Element) {
  el.classList.remove("boing");
  void (el as HTMLElement).offsetWidth;
  el.classList.add("boing");
}

export function stickerItems(): Item[] {
  return progress.stickers.map((id) => byId.get(id)).filter((i): i is Item => !!i);
}
