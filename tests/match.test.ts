import { describe, expect, it } from "vitest";
import { byId, EXTRAS, ITEMS } from "../src/data/items";
import { findSpokenItem, heardItem, phraseMatches } from "../src/lib/match";
import { ART } from "../src/art/art";

const item = (id: string) => byId.get(id)!;

describe("phraseMatches", () => {
  it("matches exact words inside a sentence", () => {
    expect(phraseMatches("it's a fire truck", "fire truck")).toBe(true);
    expect(phraseMatches("FIRE TRUCK!", "fire truck")).toBe(true);
  });

  it("forgives small mispronunciations", () => {
    expect(phraseMatches("escavator", "excavator")).toBe(true);
    expect(phraseMatches("bulldoser", "bulldozer")).toBe(true);
    expect(phraseMatches("firetruck", "fire truck")).toBe(true);
    expect(phraseMatches("dogs", "dog")).toBe(true);
  });

  it("does not confuse short different words", () => {
    expect(phraseMatches("cow", "car")).toBe(false);
    expect(phraseMatches("cat", "car")).toBe(false);
    expect(phraseMatches("pig", "big rig")).toBe(false);
  });
});

describe("heardItem", () => {
  it("accepts aliases", () => {
    expect(heardItem(["digger"], item("excavator"))).toBe(true);
    expect(heardItem(["a dinosaur"], item("trex"))).toBe(true);
    expect(heardItem(["t rex"], item("trex"))).toBe(true);
    expect(heardItem(["choo choo"], item("train"))).toBe(true);
  });

  it("checks every alternative the recognizer offers", () => {
    expect(heardItem(["tractor", "tracker"], item("tractor"))).toBe(true);
    expect(heardItem(["hello", "moo cow"], item("cow"))).toBe(true);
    expect(heardItem(["hello"], item("cow"))).toBe(false);
  });
});

describe("findSpokenItem", () => {
  it("finds the most specific match", () => {
    expect(findSpokenItem(["show me a fire truck"], ITEMS)?.id).toBe("firetruck");
    expect(findSpokenItem(["cement mixer please"], ITEMS)?.id).toBe("mixer");
    expect(findSpokenItem(["triceratops"], ITEMS)?.id).toBe("triceratops");
  });

  it("returns nothing for unknown words", () => {
    expect(findSpokenItem(["banana phone"], ITEMS)).toBeUndefined();
  });
});

describe("catalog", () => {
  it("has unique ids", () => {
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(ITEMS.length);
  });

  it("every item has a picture", () => {
    for (const i of [...ITEMS, ...EXTRAS]) {
      expect(Boolean(i.emoji) || Boolean(i.art && ART[i.art]), i.id).toBe(true);
    }
  });
});
