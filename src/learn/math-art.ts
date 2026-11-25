/** SVG drawings for math: shapes, solids, base-ten blocks, clocks, length bars. */

const INK = "#2b2b3a";
const svg = (body: string, vb = "0 0 200 200") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${body}</svg>`;
const st = `stroke="${INK}" stroke-width="7" stroke-linejoin="round"`;

export const SHAPES_2D = ["circle", "square", "triangle", "rectangle", "oval", "star", "heart", "diamond"] as const;
export type Shape2D = (typeof SHAPES_2D)[number];

export function shape2d(name: Shape2D, color: string): string {
  const f = `fill="${color}" ${st}`;
  switch (name) {
    case "circle":
      return svg(`<circle cx="100" cy="100" r="78" ${f}/>`);
    case "square":
      return svg(`<rect x="28" y="28" width="144" height="144" rx="6" ${f}/>`);
    case "triangle":
      return svg(`<path d="M100 22 L182 170 L18 170 Z" ${f}/>`);
    case "rectangle":
      return svg(`<rect x="10" y="52" width="180" height="96" rx="6" ${f}/>`);
    case "oval":
      return svg(`<ellipse cx="100" cy="100" rx="88" ry="58" ${f}/>`);
    case "star":
      return svg(`<path d="M100 14 L124 76 L190 78 L138 118 L156 182 L100 146 L44 182 L62 118 L10 78 L76 76 Z" ${f}/>`);
    case "heart":
      return svg(`<path d="M100 176 C40 130 14 100 14 66 C14 36 38 18 62 18 C82 18 94 30 100 44 C106 30 118 18 138 18 C162 18 186 36 186 66 C186 100 160 130 100 176 Z" ${f}/>`);
    case "diamond":
      return svg(`<path d="M100 12 L172 100 L100 188 L28 100 Z" ${f}/>`);
  }
}

export const SHAPE_FACTS: Record<Shape2D, string> = {
  circle: "A circle is round, like a wheel.",
  square: "A square has four sides that are all the same.",
  triangle: "A triangle has three sides and three corners.",
  rectangle: "A rectangle has four sides. Two are long and two are short.",
  oval: "An oval is like a stretched circle, like an egg.",
  star: "A star has five points.",
  heart: "A heart is the shape of love.",
  diamond: "A diamond looks like a kite.",
};

export const SOLIDS = ["cube", "sphere", "cone", "cylinder", "pyramid"] as const;
export type Solid = (typeof SOLIDS)[number];

export function solid(name: Solid, color: string): string {
  const shade = "rgba(0,0,0,0.18)";
  const light = "rgba(255,255,255,0.35)";
  switch (name) {
    case "cube":
      return svg(
        `<path d="M40 70 L110 70 L110 170 L40 170 Z" fill="${color}" ${st}/>` +
          `<path d="M40 70 L80 34 L160 34 L110 70 Z" fill="${color}" ${st}/><path d="M40 70 L80 34 L160 34 L110 70 Z" fill="${light}"/>` +
          `<path d="M110 70 L160 34 L160 134 L110 170 Z" fill="${color}" ${st}/><path d="M110 70 L160 34 L160 134 L110 170 Z" fill="${shade}"/>`,
      );
    case "sphere":
      return svg(
        `<circle cx="100" cy="100" r="78" fill="${color}" ${st}/>` +
          `<ellipse cx="72" cy="70" rx="24" ry="16" fill="${light}" transform="rotate(-30 72 70)"/>` +
          `<path d="M24 104 Q100 150 176 104" fill="none" stroke="${shade}" stroke-width="6"/>`,
      );
    case "cone":
      return svg(
        `<path d="M100 18 L172 160 A72 22 0 0 1 28 160 Z" fill="${color}" ${st}/>` +
          `<path d="M100 18 L172 160 A72 22 0 0 1 120 180 Z" fill="${shade}"/>` +
          `<ellipse cx="100" cy="160" rx="72" ry="22" fill="none" ${st}/>`,
      );
    case "cylinder":
      return svg(
        `<path d="M40 48 L40 152 A60 20 0 0 0 160 152 L160 48" fill="${color}" ${st}/>` +
          `<path d="M120 66 L120 170 A60 20 0 0 0 160 152 L160 48 Z" fill="${shade}"/>` +
          `<ellipse cx="100" cy="48" rx="60" ry="20" fill="${color}" ${st}/><ellipse cx="100" cy="48" rx="60" ry="20" fill="${light}"/>`,
      );
    case "pyramid":
      return svg(
        `<path d="M100 20 L30 150 L120 178 Z" fill="${color}" ${st}/>` +
          `<path d="M100 20 L120 178 L176 140 Z" fill="${color}" ${st}/><path d="M100 20 L120 178 L176 140 Z" fill="${shade}"/>`,
      );
  }
}

export const SOLID_FACTS: Record<Solid, string> = {
  cube: "A cube is like a box. It has six square faces.",
  sphere: "A sphere is round like a ball.",
  cone: "A cone is like an ice cream cone. It has a point on top.",
  cylinder: "A cylinder is like a can.",
  pyramid: "A pyramid has a point on top and triangle sides.",
};

/** Base-ten blocks: `tens` rods and `ones` cubes. */
export function baseTen(tens: number, ones: number): string {
  const rodW = 18;
  const gap = 8;
  const cube = 18;
  const rodsW = tens * (rodW + gap);
  const onesCols = Math.min(5, ones || 1);
  const w = Math.max(60, rodsW + (ones ? 16 + onesCols * (cube + 4) : 0));
  let body = "";
  for (let t = 0; t < tens; t++) {
    const x = 4 + t * (rodW + gap);
    body += `<rect x="${x}" y="4" width="${rodW}" height="180" rx="3" fill="#42a5f5" stroke="${INK}" stroke-width="3"/>`;
    for (let k = 1; k < 10; k++) body += `<line x1="${x}" x2="${x + rodW}" y1="${4 + k * 18}" y2="${4 + k * 18}" stroke="${INK}" stroke-width="1.5"/>`;
  }
  for (let o = 0; o < ones; o++) {
    const x = 4 + rodsW + 12 + (o % 5) * (cube + 4);
    const y = 184 - cube - Math.floor(o / 5) * (cube + 4);
    body += `<rect x="${x}" y="${y}" width="${cube}" height="${cube}" rx="2" fill="#ffca28" stroke="${INK}" stroke-width="3"/>`;
  }
  return svg(body, `0 0 ${w + 8} 190`);
}

/** An analog clock face. */
export function clockFace(hour: number, minute: number): string {
  let body = `<circle cx="100" cy="100" r="92" fill="#fff" ${st}/>`;
  for (let i = 1; i <= 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const x = 100 + Math.sin(a) * 72;
    const y = 100 - Math.cos(a) * 72 + 8;
    body += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" font-size="22" font-weight="800" font-family="system-ui, sans-serif" fill="${INK}">${i}</text>`;
  }
  for (let i = 0; i < 60; i++) {
    if (i % 5 === 0) continue;
    const a = (i / 60) * Math.PI * 2;
    body += `<circle cx="${(100 + Math.sin(a) * 86).toFixed(1)}" cy="${(100 - Math.cos(a) * 86).toFixed(1)}" r="1.6" fill="${INK}"/>`;
  }
  const ha = ((hour % 12) + minute / 60) * 30;
  const ma = minute * 6;
  body += `<line x1="100" y1="100" x2="100" y2="52" stroke="#e53935" stroke-width="10" stroke-linecap="round" transform="rotate(${ha} 100 100)"/>`;
  body += `<line x1="100" y1="100" x2="100" y2="26" stroke="#1e88e5" stroke-width="7" stroke-linecap="round" transform="rotate(${ma} 100 100)"/>`;
  body += `<circle cx="100" cy="100" r="7" fill="${INK}"/>`;
  return svg(body);
}

/** A crayon of a given length (0–1) for longer/shorter. Same canvas size so lengths compare. */
export function crayon(len: number, color: string): string {
  const w = 40 + len * 300;
  return svg(
    `<rect x="4" y="14" width="${w}" height="32" rx="6" fill="${color}" stroke="${INK}" stroke-width="4"/>` +
      `<path d="M${w + 4} 14 L${w + 34} 30 L${w + 4} 46 Z" fill="${color}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
      `<rect x="14" y="14" width="10" height="32" fill="rgba(0,0,0,0.15)"/>`,
    "0 0 380 60",
  );
}
