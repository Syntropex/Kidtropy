/**
 * Drawing studio: coloring pages made from our own art, free drawing with
 * crayons, glitter and picture stamps, and a gallery of everything made.
 * Everything is kept on this device (see draw-shared.ts).
 */
import { sfx } from "../lib/sfx";
import { speak } from "../lib/speech";
import { bounce, h } from "../lib/ui";
import { colorLines, colorPage, pageById, pagePicker, PAGES, prepare, renderPage, type Page } from "./draw-color";
import { DOT_PICS, type DotPic } from "./draw-dots-data";
import { dotGame, dotLines, dotsFace, dotsPicker } from "./draw-dots";
import { freeDraw, freeLines } from "./draw-free";
import { crayonBox, entryFace, galleryScreen } from "./draw-gallery";
import { gallery, ICONS, PALETTE, SAY, sharedLines, svgIcon, type ColorEntry, type FreeEntry } from "./draw-shared";
import type { Game, Scene } from "./types";
import "./draw.css";

let greeted = false;

export const draw: Game = {
  id: "draw",
  title: "Draw",
  icon: "🖍️",
  color: "#ec407a",
  start(scene: Scene) {
    let sub: AbortController | null = null;
    /** Each screen gets its own signal, aborted when the next screen opens. */
    const screen = () => {
      sub?.abort();
      const c = new AbortController();
      scene.signal.addEventListener("abort", () => c.abort(), { signal: c.signal });
      sub = c;
      return { signal: c.signal, alive: () => scene.alive() && !c.signal.aborted };
    };
    const root = scene.root;

    function home() {
      screen();
      const card = (cls: string, label: string, face: Node, go: () => void, i: number) => {
        const b = h("button", { class: `d-card ${cls} pop-in`, style: `animation-delay:${i * 70}ms`, "aria-label": label }, face);
        b.addEventListener("click", () => {
          sfx.pop();
          bounce(b);
          setTimeout(go, 150);
        });
        return b;
      };
      const latest = gallery().find((e) => e.kind === "free" || pageById.has(e.page));
      const artFace = latest ? entryFace(latest) : null;
      root.replaceChildren(
        h(
          "div",
          { class: "d-home" },
          card("d-card-color", "Coloring pages", coloringFace(), pick, 0),
          card("d-card-dots", "Dot to dot", h("span", { class: "d-card-face" }, dotsFace()), dotsPick, 1),
          card("d-card-free", "Free draw", h("span", { class: "d-card-face" }, svgIcon(ICONS.squiggle, "d-squiggle"), svgIcon(ICONS.sparkle, "d-card-spark")), () => free(), 2),
          card(
            "d-card-art",
            "My art",
            h("span", { class: "d-card-face d-frame-face" }, svgIcon(ICONS.frame, "d-frame-ico"), artFace ? h("span", { class: "d-frame-pic" }, artFace) : null),
            art,
            3,
          ),
        ),
      );
      if (!greeted) {
        greeted = true;
        void speak(SAY.hello);
      }
    }

    function pick() {
      const s = screen();
      pagePicker(root, s.signal, home, (p) => color(p));
    }

    function color(page: Page, entry?: ColorEntry) {
      const s = screen();
      const back = entry ? art : page.cat === "dots" ? dotsPick : pick;
      colorPage(root, { page, entry, ...s, back, done: art });
    }

    function dotsPick() {
      const s = screen();
      dotsPicker(root, s.signal, home, dots);
    }

    function dots(p: DotPic) {
      const s = screen();
      dotGame(root, {
        pic: p,
        ...s,
        back: dotsPick,
        color: () => {
          const page = pageById.get(`dots-${p.id}`);
          if (page) color(page);
        },
        next: () => dots(DOT_PICS[(DOT_PICS.indexOf(p) + 1) % DOT_PICS.length]),
      });
    }

    function free(entry?: FreeEntry) {
      const s = screen();
      freeDraw(root, { ...s, entry, back: home });
    }

    function art() {
      const s = screen();
      galleryScreen(root, {
        ...s,
        back: home,
        openColor: (e) => {
          const p = pageById.get(e.page);
          if (p) color(p, e);
        },
        openFree: (e) => free(e),
        goColor: pick,
        goFree: () => free(),
      });
    }

    home();
    return () => sub?.abort();
  },
  lines: () => [...sharedLines(), ...colorLines(), ...freeLines(), ...dotLines()],
};

/** A half-colored excavator page with crayons: "this is where you color". */
function coloringFace(): HTMLElement {
  const page = PAGES.find((p) => p.id === "excavator") ?? PAGES[0];
  const n = prepare(page).n;
  const fills: Record<number, string> = {};
  const cols = PALETTE.filter((c) => c.css.startsWith("#") && c.css !== "#ffffff" && c.css !== "#2f2f38");
  for (let i = 0; i < n; i += 2) fills[i] = cols[(i * 5) % cols.length].css;
  return h("span", { class: "d-card-face" }, renderPage(page, fills), svgIcon(crayonBox(), "d-card-crayons"));
}
