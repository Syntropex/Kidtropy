/**
 * Songs for "follow the lights": simple public-domain tunes squeezed onto the
 * eight xylophone bars (C D E F G A B C).
 *
 * Notes are written as letters, with high C as "C", and an optional length
 * in beats: "g2" is a long G, "g.5" a quick one. Some tunes are moved to F
 * (F is "do") so they fit; Happy Birthday's last line is simplified because
 * it needs a B-flat. Pick-up notes below C are left out (Itsy Bitsy) or
 * moved up (the "ding, dang, dong" in Are You Sleeping).
 */
export interface Song {
  id: string;
  /** What we say when it is picked. */
  title: string;
  /** An item id (src/data/items.ts), an emoji or one of our drawings for its picture. */
  picture: { item?: string; emoji?: string; art?: string; cls?: string };
  bpm: number;
  notes: { bar: number; beats: number }[];
}

const BAR: Record<string, number> = { c: 0, d: 1, e: 2, f: 3, g: 4, a: 5, b: 6, C: 7 };

function parse(tune: string): Song["notes"] {
  return tune
    .trim()
    .split(/\s+/)
    .map((tok) => {
      const m = tok.match(/^([a-gC])([\d.]*)$/);
      if (!m) throw new Error(`bad note ${tok}`);
      return { bar: BAR[m[1]], beats: m[2] ? Number(m[2]) : 1 };
    });
}

const song = (id: string, title: string, picture: Song["picture"], bpm: number, tune: string): Song => ({
  id,
  title,
  picture,
  bpm,
  notes: parse(tune),
});

export const SONGS: Song[] = [
  song("twinkle", "Twinkle, Twinkle, Little Star!", { emoji: "⭐" }, 100, `
    c c g g a a g2
    f f e e d d c2`),
  song("macdonald", "Old MacDonald!", { item: "cow" }, 120, `
    f f f c d d c2
    a a g g f2
    c.5 c.5 f f f2 c.5 c.5 f f f2
    f f f c d d c2
    a a g g f2`),
  song("bus", "The Wheels on the Bus!", { item: "bus" }, 120, `
    c f f.5 f.5 f a C a f2
    g e c2
    C a f2
    c f f.5 f.5 f a C a f2
    g c c f2`),
  song("spider", "Itsy Bitsy Spider!", { art: "spider" }, 112, `
    c c c d e e2
    e d c d e c2
    e2 e f g2
    g f e f g e2
    c2 c d e2
    e d c d e c2
    c c c d e e2
    e d c d e c2`),
  song("birthday", "Happy Birthday!", { emoji: "🎂" }, 100, `
    c.75 c.25 d c f e2
    c.75 c.25 d c g f2
    c.75 c.25 C a f e d2
    a.75 a.25 a f g f2`),
  song("jingle", "Jingle Bells!", { emoji: "🔔" }, 130, `
    e e e2 e e e2
    e g c1.5 d.5 e4
    f f f1.5 f.5 f e e e.5 e.5
    e d d e d2 g2
    e e e2 e e e2
    e g c1.5 d.5 e4
    f f f f f e e e.5 e.5
    g g f d c4`),
  song("mary", "Mary Had a Little Lamb!", { item: "sheep" }, 110, `
    e d c d e e e2
    d d d2 e g g2
    e d c d e e e e
    d d e d c2`),
  song("baa", "Baa, Baa, Black Sheep!", { item: "sheep", cls: "mx-black" }, 100, `
    c c g g a.5 a.5 a.5 a.5 g2
    f f e e d d c2`),
  song("abc", "The ABC Song!", { emoji: "🔤" }, 100, `
    c c g g a a g2
    f f e e d.5 d.5 d.5 d.5 c2
    g g f2 e e d2
    g.5 g.5 g f2 e e d2
    c c g g a a g2
    f f e e d d c2`),
  song("rowboat", "Row, Row, Row Your Boat!", { item: "boat" }, 100, `
    c1.5 c1.5 c d.5 e1.5
    e d.5 e f.5 g3
    C.5 C.5 C.5 g.5 g.5 g.5 e.5 e.5 e.5 c.5 c.5 c.5
    g f.5 e d.5 c3`),
  song("bridge", "London Bridge!", { art: "bridge" }, 110, `
    g1.5 a.5 g f e f g2
    d e f2 e f g2
    g1.5 a.5 g f e f g2
    d2 g2 e c2`),
  song("buns", "Hot Cross Buns!", { emoji: "🍞" }, 100, `
    e d c2
    e d c2
    c.5 c.5 c.5 c.5 d.5 d.5 d.5 d.5
    e d c2`),
  song("rain", "Rain, Rain, Go Away!", { emoji: "☂️" }, 100, `
    g2 e2 g g e2
    g g e a g g e2
    g2 e2 g g e2`),
  song("joy", "Ode to Joy!", { emoji: "🎻" }, 110, `
    e e f g g f e d
    c c d e e1.5 d.5 d2
    e e f g g f e d
    c c d e d1.5 c.5 c2`),
  song("sleeping", "Are You Sleeping?", { emoji: "🛏️" }, 110, `
    c d e c c d e c
    e f g2 e f g2
    g.5 a.5 g.5 f.5 e c
    g.5 a.5 g.5 f.5 e c
    c g c2 c g c2`),
];

/** Seconds from the start of the song to each note. */
export function noteTimes(s: Song): number[] {
  const beat = 60 / s.bpm;
  let t = 0;
  return s.notes.map((n) => {
    const at = t;
    t += n.beats * beat;
    return at;
  });
}

export function songLength(s: Song): number {
  return s.notes.reduce((sum, n) => sum + n.beats, 0) * (60 / s.bpm);
}
