/** The crayon box: 12 crayons + 🌈, and (for free drawing) thin / fat. */
import { sfx } from "../lib/sfx";
import { speak } from "../lib/speech";
import { bounce, h } from "../lib/ui";
import { crayonSvg, ICONS, PALETTE, RAINBOW, SAY, svgIcon, type Crayon } from "./draw-shared";

export interface Palette {
  el: HTMLElement;
  /** A #rrggbb color, or RAINBOW. */
  color(): string;
  /** 0 = thin, 1 = fat. */
  size(): number;
  /** Shows the size dots in the current color. */
  refresh(): void;
}

let remembered = PALETTE[0].css;
let rememberedSize = 1;

export function palette(o: { signal: AbortSignal; sizes: boolean; onPick?: () => void }): Palette {
  let current = remembered;
  let size = rememberedSize;
  const box = h("div", { class: `d-palette ${o.sizes ? "with-sizes" : ""}` });
  const crayons = new Map<string, HTMLButtonElement>();

  const select = (c: Crayon, say: boolean) => {
    current = remembered = c.css;
    crayons.forEach((b, css) => b.classList.toggle("sel", css === c.css));
    refresh();
    if (say) void speak(c.say);
  };

  for (const c of PALETTE) {
    const b = h("button", { class: `d-crayon ${c.css === RAINBOW ? "rainbow" : ""}`, "aria-label": c.say.replace("!", ""), html: crayonSvg(c.css) });
    b.addEventListener("click", () => {
      sfx.tap();
      bounce(b);
      select(c, true);
      o.onPick?.();
    });
    crayons.set(c.css, b);
    box.append(b);
  }

  const sizeBtns: HTMLButtonElement[] = [];
  if (o.sizes) {
    [ICONS.dotSmall, ICONS.dotBig].forEach((svg, i) => {
      const b = h("button", { class: "d-size", "aria-label": i ? "Fat" : "Thin" }, svgIcon(svg));
      b.addEventListener("click", () => {
        sfx.tap();
        bounce(b);
        size = rememberedSize = i;
        refresh();
        void speak(i ? SAY.fat : SAY.thin);
        o.onPick?.();
      });
      sizeBtns.push(b);
      box.append(b);
    });
  }

  function refresh() {
    const css = current === RAINBOW ? "#ff7043" : current === "#ffffff" ? "#f5f5f5" : current;
    box.style.setProperty("--c", css);
    sizeBtns.forEach((b, i) => b.classList.toggle("sel", i === size));
  }

  select(PALETTE.find((c) => c.css === current) ?? PALETTE[0], false);
  return { el: box, color: () => current, size: () => size, refresh };
}
