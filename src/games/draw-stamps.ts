/**
 * Stamps for free drawing: every vehicle, digger, dinosaur and animal in the
 * picture catalog that has a real picture, plus some fun extras, grouped into
 * tabs for the stamp tray.
 */
import { ART } from "../art/art";
import PICS from "../data/pics.json";
import { ITEMS, type Item, type Theme } from "../data/items";
import { capitalize, h, icon, pic } from "../lib/ui";
import { loadImage } from "./draw-shared";

export interface StampDef {
  key: string;
  say: string;
  face: () => HTMLElement;
  /** Where the picture comes from: an image URL or inline SVG markup. */
  src: () => { url?: string; svg?: string; emoji?: string };
}

function fromEl(el: HTMLElement): { url?: string; svg?: string; emoji?: string } {
  const img = el.tagName === "IMG" ? (el as HTMLImageElement) : el.querySelector("img");
  if (img) return { url: img.src };
  const svg = el.querySelector("svg");
  if (svg) return { svg: svg.outerHTML };
  return { emoji: el.textContent ?? "⭐" };
}

/** Only things we have a real picture for (not the device's emoji font). No DOM needed. */
const hasGlyph = (g?: string) => !!g && !!(PICS as Record<string, string>)[g.replace(/\uFE0F/g, "")];
const hasPicture = (it: Item) => (!!it.art && !!ART[it.art]) || hasGlyph(it.emoji);

const itemStamp = (it: Item): StampDef => ({ key: it.id, say: `${capitalize(it.name)}!`, face: () => pic(it), src: () => fromEl(pic(it)) });

const glyphStamp = (glyph: string, say: string): StampDef => ({
  key: glyph,
  say,
  face: () => h("span", { class: "pic art" }, icon(glyph)),
  src: () => fromEl(icon(glyph)),
});

/** Racing/trucks items that aren't vehicles go in the fun tab instead. */
const NOT_VEHICLES = new Set(["flag", "trophy", "trafficlight", "wheel", "medal"]);

const byTheme = (themes: Theme[], skip: Set<string> = new Set()) =>
  ITEMS.filter((it) => it.themes.some((t) => themes.includes(t)) && !skip.has(it.id) && hasPicture(it)).map(itemStamp);

export interface StampCat {
  id: string;
  glyph: string;
  label: string;
  stamps: StampDef[];
}

let cats: StampCat[] | null = null;

/** Built on first use. */
export function stampCats(): StampCat[] {
  if (cats) return cats;
  const fun = [
    glyphStamp("☀️", "Sun!"),
    glyphStamp("⭐", "Star!"),
    glyphStamp("❤️", "Heart!"),
    glyphStamp("🌹", "Flower!"),
    glyphStamp("🌳", "Tree!"),
    glyphStamp("🌈", "Rainbow!"),
    glyphStamp("🌙", "Moon!"),
    glyphStamp("🎈", "Balloon!"),
    glyphStamp("🏠", "House!"),
    glyphStamp("🍄", "Mushroom!"),
    ...ITEMS.filter((it) => NOT_VEHICLES.has(it.id) && hasPicture(it)).map(itemStamp),
  ].filter((s) => ITEMS.some((i) => i.id === s.key) || hasGlyph(s.key));
  const vehicles = byTheme(["trucks", "racing"], new Set([...NOT_VEHICLES, ...ITEMS.filter((i) => i.themes.includes("construction")).map((i) => i.id)]));
  cats = [
    { id: "vehicles", glyph: "🚒", label: "Trucks and cars", stamps: vehicles },
    { id: "diggers", glyph: "🏗️", label: "Diggers", stamps: byTheme(["construction"]) },
    { id: "dinos", glyph: "🦖", label: "Dinosaurs", stamps: byTheme(["dinos"]) },
    { id: "animals", glyph: "🦁", label: "Animals", stamps: byTheme(["animals"]) },
    { id: "farm", glyph: "🐄", label: "Farm", stamps: byTheme(["farm"]) },
    { id: "fun", glyph: "⭐", label: "Fun", stamps: fun },
  ].filter((c) => c.stamps.length);
  return cats;
}

export function stampByKey(key: string): StampDef | undefined {
  for (const c of stampCats()) {
    const s = c.stamps.find((x) => x.key === key);
    if (s) return s;
  }
  return undefined;
}

const images = new Map<string, Promise<CanvasImageSource | string | null>>();

export function stampImage(def: StampDef): Promise<CanvasImageSource | string | null> {
  let p = images.get(def.key);
  if (p) return p;
  const s = def.src();
  if (s.url) p = loadImage(s.url);
  else if (s.svg) {
    const markup = s.svg.replace(/^<svg\b/, '<svg width="400" height="400"');
    const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml" }));
    p = loadImage(url).then((img) => {
      URL.revokeObjectURL(url);
      return img;
    });
  } else p = Promise.resolve(s.emoji ?? null);
  images.set(def.key, p);
  return p;
}

export function stampLines(): string[] {
  const out = new Set<string>();
  for (const c of stampCats()) for (const s of c.stamps) out.add(s.say);
  return [...out];
}
