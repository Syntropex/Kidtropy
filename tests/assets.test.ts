import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { abcItems, abcPairs, ABC_WORDS } from "../src/data/abc";
import { EXTRAS, ITEMS } from "../src/data/items";
import PICS from "../src/data/pics.json";
import MANIFEST from "../src/voice/manifest.json";
import SOUNDS from "../src/voice/sounds.json";
import { allLines, clipId, line, splitLine } from "../src/voice/lines";

const root = new URL("..", import.meta.url).pathname;

describe("voice clips", () => {
  const clips = new Set(MANIFEST.clips);
  const sentences = allLines(EXTRAS, abcPairs());

  it("every sentence the app says has a recorded clip (run `npm run voice`)", () => {
    const missing = sentences.filter((s) => !clips.has(clipId(s)));
    expect(missing).toEqual([]);
  });

  it("every clip in the manifest exists on disk", () => {
    const gone = MANIFEST.clips.filter((id) => !existsSync(`${root}public/voice/${id}.mp3`));
    expect(gone).toEqual([]);
  });

  it("splits lines into sentences and sounds", () => {
    expect(splitLine("Yes! It's a cow! [[snd:cow]] Cows give us milk.")).toEqual([
      { say: "Yes!" },
      { say: "It's a cow!" },
      { snd: "cow" },
      { say: "Cows give us milk." },
    ]);
  });

  it("uses the real sound when there is one", () => {
    const cow = ITEMS.find((i) => i.id === "cow")!;
    expect(line.saysWhat(cow)).toContain("[[snd:cow]]");
  });
});

describe("sounds and pictures", () => {
  it("every listed sound file exists", () => {
    for (const id of SOUNDS) expect(existsSync(`${root}public/sounds/${id}.mp3`), id).toBe(true);
  });

  it("every picture file exists", () => {
    for (const id of Object.values(PICS as Record<string, string>)) expect(existsSync(`${root}public/pics/${id}.webp`), id).toBe(true);
  });

  it("ABC words exist and start with their letter", () => {
    for (const L of Object.keys(ABC_WORDS)) {
      for (const item of abcItems(L)) expect(item.name.charAt(0).toUpperCase(), item.name).toBe(L);
    }
  });
});
