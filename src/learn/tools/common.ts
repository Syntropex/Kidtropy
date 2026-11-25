/** Little helpers shared by the tools. */
import { h, icon } from "../../lib/ui";

const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

/** 47 -> "forty-seven", 120 -> "one hundred twenty" (0–999). */
export function numberWord(n: number): string {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : "");
  const rest = n % 100;
  return `${ONES[Math.floor(n / 100)]} hundred${rest ? ` ${numberWord(rest)}` : ""}`;
}

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Forty-seven!" (same wording as the games' "Seven!"). */
export const sayNumber = (n: number) => `${cap(numberWord(n))}!`;

export function numberLines(from: number, to: number): string[] {
  const out: string[] = [];
  for (let n = from; n <= to; n++) out.push(sayNumber(n));
  return out;
}

export const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
export const LOWER = "abcdefghijklmnopqrstuvwxyz".split("");
export const DIGITS = "0123456789".split("");

/** A big round icon button (≥64px). */
export function toolBtn(glyph: string, label: string, onclick: (e: MouseEvent) => void, cls = ""): HTMLButtonElement {
  return h("button", { class: `t-btn ${cls}`, "aria-label": label, title: label, onclick }, icon(glyph));
}

/** addEventListener that goes away when the tool is left. */
export function on(
  target: EventTarget,
  type: string,
  fn: (e: any) => void,
  signal: AbortSignal,
  opts: AddEventListenerOptions = {},
) {
  target.addEventListener(type, fn, { ...opts, signal });
}

/**
 * Lays out n square buttons in `grid` as big as they fit (sets --cols/--cell).
 * Re-fits when the grid's box changes size.
 */
export function fitGrid(grid: HTMLElement, n: () => number, signal: AbortSignal, gap = 12, maxCell = 170) {
  const fit = () => {
    const r = grid.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const count = n();
    let best = 0;
    let bestCols = 1;
    for (let cols = 1; cols <= count; cols++) {
      const rows = Math.ceil(count / cols);
      const cell = Math.min((r.width - (cols - 1) * gap) / cols, (r.height - (rows - 1) * gap) / rows);
      if (cell > best) {
        best = cell;
        bestCols = cols;
      }
    }
    grid.style.setProperty("--cols", String(bestCols));
    grid.style.setProperty("--cell", `${Math.floor(Math.min(best, maxCell))}px`);
    grid.style.setProperty("--gap", `${gap}px`);
  };
  const ro = new ResizeObserver(fit);
  ro.observe(grid);
  signal.addEventListener("abort", () => ro.disconnect());
  return fit;
}
