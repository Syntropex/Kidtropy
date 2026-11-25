/**
 * Forgiving word matching for little voices.
 *
 * Speech recognition hears preschoolers imperfectly ("twuck", "escavator"),
 * so we normalise what was heard and accept close-enough matches.
 */

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Plain Levenshtein edit distance. */
export function distance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = cur;
  }
  return prev[b.length];
}

/** How many typos we forgive for a word of this length. */
function allowance(len: number): number {
  if (len <= 3) return 0;
  if (len <= 5) return 1;
  if (len <= 8) return 2;
  return 3;
}

/**
 * Does the heard phrase contain the target phrase (or something close to it)?
 * Matches on word boundaries, sliding a window the size of the target over
 * the heard words, and also tries the words glued together ("fire truck" vs
 * "firetruck").
 */
export function phraseMatches(heard: string, target: string): boolean {
  const h = normalize(heard);
  const t = normalize(target);
  if (!h || !t) return false;
  if (` ${h} `.includes(` ${t} `)) return true;
  // "dogs" should count for "dog".
  const singular = h.replace(/(\w{3,})s\b/g, "$1");
  if (singular !== h && ` ${singular} `.includes(` ${t} `)) return true;

  const hw = h.split(" ");
  const tw = t.split(" ");
  const tGlued = tw.join("");
  for (let size = Math.max(1, tw.length - 1); size <= tw.length + 1; size++) {
    for (let i = 0; i + size <= hw.length; i++) {
      const windowGlued = hw.slice(i, i + size).join("");
      if (distance(windowGlued, tGlued) <= allowance(tGlued.length)) return true;
    }
  }
  return false;
}

export interface Matchable {
  id: string;
  name: string;
  aliases?: string[];
}

/** Does any of the recognizer's alternatives match this item? */
export function heardItem(alternatives: string[], item: Matchable): boolean {
  const words = [item.name, ...(item.aliases ?? [])];
  return alternatives.some((alt) => words.some((w) => phraseMatches(alt, w)));
}

/**
 * Find which item (if any) a kid asked for, e.g. "show me a dinosaur".
 * Prefers the longest / most specific match so "fire truck" beats "truck".
 */
export function findSpokenItem<T extends Matchable>(alternatives: string[], items: T[]): T | undefined {
  let best: { item: T; score: number } | undefined;
  for (const alt of alternatives) {
    for (const item of items) {
      for (const w of [item.name, ...(item.aliases ?? [])]) {
        if (!phraseMatches(alt, w)) continue;
        const exact = ` ${normalize(alt)} `.includes(` ${normalize(w)} `) ? 100 : 0;
        const score = exact + normalize(w).length + (w === item.name ? 1 : 0);
        if (!best || score > best.score) best = { item, score };
      }
    }
  }
  return best?.item;
}
