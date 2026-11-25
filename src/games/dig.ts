/**
 * Dino Dig — rub the dirt away with your finger to find what's buried.
 */
import { byId, withArticle, type Item } from "../data/items";
import { sfx } from "../lib/sfx";
import { speak } from "../lib/speech";
import { bounce, capitalize, h, makeDeck, pic, reward, wait } from "../lib/ui";
import type { Game } from "./types";

const PRIZES: Item[] = [
  ...["trex", "longneck", "triceratops", "stegosaurus", "pterodactyl", "egg", "bone"].map((id) => byId.get(id)!),
  { id: "fossil", name: "dinosaur fossil", art: "fossil", themes: ["dinos"], fact: "Fossils are dinosaur bones that turned into rock." },
  { id: "gem", name: "treasure", article: "some", emoji: "💎", themes: [], fact: "Shiny, sparkly treasure!" },
];

export const dig: Game = {
  id: "dig",
  title: "Dino Dig",
  icon: "🦴",
  color: "#8d6e63",
  start(scene) {
    const { root } = scene;
    const next = makeDeck(() => PRIZES, 4);
    let round = 0;

    function play() {
      const id = ++round;
      const live = () => scene.alive() && id === round;
      const prize = next();
      const prizeEl = h("div", { class: "dig-prize" }, pic(prize));
      const canvas = h("canvas", { class: "dig-dirt", "aria-label": "Dirt. Rub it with your finger to dig." });
      const tool = h("div", { class: "dig-tool", "aria-hidden": "true" }, "⛏️");
      const pit = h("div", { class: "dig-pit" }, prizeEl, canvas, tool);
      const word = h("div", { class: "big-word", "aria-live": "polite" });
      const again = h("button", { class: "go-btn hidden", "aria-label": "Dig again" }, "⛏️ Again!");
      root.replaceChildren(h("div", { class: "dig-wrap" }, pit, word, again));

      const ctx = canvas.getContext("2d")!;
      let w = 0;
      let hgt = 0;
      const dpr = Math.min(2, window.devicePixelRatio || 1);

      function paintDirt() {
        const r = pit.getBoundingClientRect();
        w = r.width;
        hgt = r.height;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(hgt * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.globalCompositeOperation = "source-over";
        // Layers of earth.
        const bands = ["#a1887f", "#8d6e63", "#795548", "#6d4c41"];
        bands.forEach((c, i) => {
          ctx.fillStyle = c;
          ctx.fillRect(0, (hgt / bands.length) * i, w, hgt / bands.length + 1);
        });
        // Speckles and pebbles.
        for (let i = 0; i < (w * hgt) / 120; i++) {
          ctx.fillStyle = ["#5d4037", "#bcaaa4", "#4e342e", "#d7ccc8"][i % 4];
          ctx.globalAlpha = 0.5;
          const s = 1 + Math.random() * 3;
          ctx.fillRect(Math.random() * w, Math.random() * hgt, s, s);
        }
        ctx.globalAlpha = 1;
        for (let i = 0; i < 14; i++) {
          ctx.fillStyle = ["#9e9e9e", "#bdbdbd", "#757575"][i % 3];
          ctx.beginPath();
          ctx.ellipse(Math.random() * w, Math.random() * hgt, 6 + Math.random() * 12, 4 + Math.random() * 8, Math.random() * 3, 0, Math.PI * 2);
          ctx.fill();
        }
        // Grass on top.
        ctx.fillStyle = "#7cb342";
        ctx.fillRect(0, 0, w, 14);
      }
      paintDirt();

      let digging = false;
      let last: { x: number; y: number } | null = null;
      let strokes = 0;
      let found = false;
      let lastSound = 0;

      const pos = (e: PointerEvent) => {
        const r = canvas.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
      };

      function scrape(p: { x: number; y: number }) {
        const radius = Math.max(22, Math.min(w, hgt) * 0.08);
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineCap = "round";
        ctx.lineWidth = radius * 2;
        ctx.beginPath();
        ctx.moveTo((last ?? p).x, (last ?? p).y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        last = p;
        tool.style.transform = `translate(${p.x}px, ${p.y}px)`;
        const now = performance.now();
        if (now - lastSound > 90) {
          sfx.dig();
          lastSound = now;
        }
        if (++strokes % 12 === 0) check();
      }

      function cleared(): number {
        const sw = 40;
        const sh = 40;
        const tmp = document.createElement("canvas");
        tmp.width = sw;
        tmp.height = sh;
        const t = tmp.getContext("2d")!;
        t.drawImage(canvas, 0, 0, sw, sh);
        const data = t.getImageData(0, 0, sw, sh).data;
        let clear = 0;
        // Only count the middle, where the prize is.
        let total = 0;
        for (let y = 6; y < sh - 6; y++) {
          for (let x = 6; x < sw - 6; x++) {
            total++;
            if (data[(y * sw + x) * 4 + 3] < 40) clear++;
          }
        }
        return clear / total;
      }

      async function check() {
        if (found || cleared() < 0.55) return;
        found = true;
        canvas.classList.add("gone");
        tool.classList.add("hidden");
        bounce(prizeEl);
        word.textContent = capitalize(prize.name);
        void reward(prizeEl);
        await speak(`You found ${withArticle(prize)}! ${prize.sound ?? ""} ${prize.fact ?? ""}`);
        if (!live()) return;
        again.classList.remove("hidden");
        again.classList.add("pop-in");
      }

      canvas.addEventListener("pointerdown", (e) => {
        if (found) return;
        digging = true;
        last = null;
        canvas.setPointerCapture(e.pointerId);
        tool.classList.add("active");
        scrape(pos(e));
      });
      canvas.addEventListener("pointermove", (e) => {
        if (digging && !found) scrape(pos(e));
      });
      const up = () => {
        digging = false;
        last = null;
        tool.classList.remove("active");
        void check();
      };
      canvas.addEventListener("pointerup", up);
      canvas.addEventListener("pointercancel", up);
      prizeEl.onclick = () => found && void speak(`${capitalize(withArticle(prize))}! ${prize.sound ?? ""}`);
      again.onclick = () => {
        sfx.whoosh();
        play();
      };

      void (async () => {
        await wait(200);
        if (live()) await speak(round === 1 ? "Something is buried in the dirt! Rub with your finger to dig it up!" : "Dig, dig, dig! What's down there?");
      })();
    }

    play();
  },
};
