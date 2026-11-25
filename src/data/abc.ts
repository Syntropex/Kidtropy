/** Words for each letter in the ABC game (item ids from items.ts). Theme matches come first. */
import { byId, type Item } from "./items";

export const ABC_WORDS: Record<string, string[]> = {
  A: ["airplane", "ambulance", "apple"],
  B: ["bulldozer", "bus", "bear", "bee"],
  C: ["car", "cow", "crane", "crocodile"],
  D: ["dumptruck", "duck", "dog"],
  E: ["excavator", "elephant", "egg"],
  F: ["firetruck", "frog", "farmer"],
  G: ["garbage", "giraffe", "goat"],
  H: ["helicopter", "horse", "hammer"],
  I: ["icecream"],
  J: ["juice", "jellyfish"],
  K: ["kangaroo", "kite"],
  L: ["lion", "ladder"],
  M: ["monster", "monkey", "motorcycle", "medal"],
  N: ["nest", "nose"],
  O: ["octopus", "owl"],
  P: ["pickup", "pig", "police", "pterodactyl", "penguin"],
  Q: ["queen"],
  R: ["racecar", "roller", "rooster", "rocket"],
  S: ["stegosaurus", "sheep", "snake", "shark"],
  T: ["tractor", "trex", "train", "triceratops", "tow", "trophy", "turtle"],
  U: ["umbrella", "unicorn"],
  V: ["volcano", "van"],
  W: ["whale"],
  X: ["xray"],
  Y: ["yoyo", "yak"],
  Z: ["zebra"],
};

export function abcItems(letter: string): Item[] {
  return ABC_WORDS[letter].map((id) => {
    const item = byId.get(id);
    if (!item) throw new Error(`ABC word ${id} is not in items.ts`);
    return item;
  });
}

/** Every [letter, word] pair, for the voice generator. */
export function abcPairs(): [string, string][] {
  return Object.keys(ABC_WORDS).flatMap((L) => abcItems(L).map((i) => [L, i.name] as [string, string]));
}
