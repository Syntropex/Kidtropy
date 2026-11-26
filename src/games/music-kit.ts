/** What each Music screen gets from the game: the mixer and the screen helpers. */
import type { Mixer } from "./music-synth";

export interface Kit {
  mixer: Mixer | null;
  /** Aborted when this screen is left. */
  signal: AbortSignal;
  /** Replace the screen: a toolbar (with a back button when `back` is given) and a body. */
  show(cls: string, top: Node[] | null, body: Node, back?: () => void): void;
  roundBtn(child: Node, label: string, onTap: () => void, cls?: string): HTMLButtonElement;
  spacer(): HTMLElement;
  /** Back to the Music picker. */
  home(): void;
  /** Dev-only state for tests. */
  dbg: Record<string, unknown>;
}

/** A setTimeout that is cancelled when the signal aborts. */
export function later(signal: AbortSignal, ms: number, fn: () => void) {
  const id = setTimeout(() => {
    if (!signal.aborted) fn();
  }, ms);
  signal.addEventListener("abort", () => clearTimeout(id));
}
