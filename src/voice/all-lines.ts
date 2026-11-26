/**
 * Every sentence the whole app can say, for the voice generator and tests.
 * (Kept apart from lines.ts so the app itself doesn't import every module twice.)
 */
import { abcPairs } from "../data/abc";
import { EXTRAS } from "../data/items";
import { GAMES } from "../games/index";
import { EXTRA_TABS, SOUND_EXTRAS } from "../data/soundboard";
import { LESSONS, SKILLS, SPEAK_AS, TOOLS } from "../learn/registry";
import { learnLines } from "../learn/say";
import { allLines as gameLines, line, splitLine } from "./lines";

export function everySentence(): string[] {
  const raw = [...gameLines(EXTRAS, abcPairs()), ...learnLines()];
  for (const s of SKILLS) raw.push(s.intro, ...s.lines());
  for (const l of LESSONS) raw.push(...l.lines());
  for (const t of TOOLS) raw.push(...t.lines());
  for (const g of GAMES) raw.push(...(g.lines?.() ?? []));
  for (const t of EXTRA_TABS) raw.push(t.say);
  for (const i of SOUND_EXTRAS) raw.push(line.name(i));
  const out = new Set<string>();
  for (const l of raw)
    for (const p of splitLine(l)) {
      if ("say" in p) out.add(p.say);
      else if ("fr" in p) out.add(`fr:${p.fr}`); // French voice; see scripts/voice/generate.py
    }
  return [...out];
}

export { SPEAK_AS };
