/** My art: every saved picture, big view, keep going, share, throw away. */
import { sfx } from "../lib/sfx";
import { speak } from "../lib/speech";
import { bounce, h } from "../lib/ui";
import { fitSquares, pageById, pageToCanvas, prepare, renderPage } from "./draw-color";
import {
  blobFromCanvas,
  confirmBox,
  dBtn,
  deleteEntry,
  fluent,
  gallery,
  ICONS,
  loadImage,
  SAY,
  shareOrDownload,
  svgIcon,
  type ColorEntry,
  type Entry,
  type FreeEntry,
} from "./draw-shared";

export interface GalleryOpts {
  signal: AbortSignal;
  alive: () => boolean;
  back: () => void;
  openColor: (e: ColorEntry) => void;
  openFree: (e: FreeEntry) => void;
  /** Make something new (when the gallery is empty). */
  goColor: () => void;
  goFree: () => void;
}

/** The picture for an entry (null if its coloring page no longer exists). */
export function entryFace(e: Entry): Element | null {
  if (e.kind === "free") return h("img", { class: "d-art-img", src: e.img, alt: "", draggable: "false" });
  const page = pageById.get(e.page);
  if (!page) return null;
  return renderPage(page, e.n === prepare(page).n ? e.fills : {});
}

let said = false;

export function galleryScreen(root: HTMLElement, o: GalleryOpts) {
  const items = gallery().filter((e) => e.kind === "free" || pageById.has(e.page));
  const bar = h("div", { class: "d-bar" }, dBtn(fluent("⬅"), "Back", o.back));
  if (!items.length) {
    const go = (glyph: Node, label: string, fn: () => void) => dBtn(glyph, label, fn, "d-big-go");
    root.replaceChildren(
      h(
        "div",
        { class: "d-screen" },
        bar,
        h(
          "div",
          { class: "g-empty pop-in" },
          svgIcon(ICONS.frame, "g-empty-frame"),
          h("div", { class: "g-empty-row" }, go(svgIcon(crayonBox()), "Coloring pages", o.goColor), go(svgIcon(ICONS.squiggle), "Free draw", o.goFree)),
        ),
      ),
    );
    void speak(SAY.galleryEmpty);
    return;
  }
  const grid = h("div", { class: "d-fitgrid g-grid" });
  items.forEach((e, i) => {
    const face = entryFace(e);
    if (!face) return;
    const b = h("button", { class: `g-frame pop-in`, style: `animation-delay:${Math.min(i, 12) * 30}ms;--tilt:${((i * 37) % 7) - 3}deg`, "aria-label": "Picture" }, h("span", { class: "g-mat" }, face));
    b.addEventListener("click", () => {
      sfx.pop();
      bounce(b);
      viewer(e, o, () => galleryScreen(root, o));
    });
    grid.append(b);
  });
  root.replaceChildren(h("div", { class: "d-screen" }, bar, grid));
  fitSquares(grid, items.length, o.signal, 16, 230, 110);
  if (!said) {
    said = true;
    void speak(SAY.gallery);
  }
}

/** Big view of one picture. */
function viewer(e: Entry, o: GalleryOpts, refresh: () => void) {
  const face = entryFace(e);
  if (!face) return;
  const close = () => {
    overlay.classList.add("leaving");
    setTimeout(() => overlay.remove(), 250);
  };
  // Make the picture file now, so sharing happens right on the tap
  // (iPhone/iPad only allow the share sheet straight after a tap).
  let blob: Blob | null = null;
  const making = toBlob(e).then((b) => (blob = b));

  const share = dBtn(svgIcon(ICONS.share), "Save or share", async () => {
    bounce(share);
    const b = blob ?? (await making);
    if (b) await shareOrDownload(b, `kidtropy-${new Date(e.t).toISOString().slice(0, 10)}.png`);
  });
  const keepGoing = dBtn(fluent("✏️"), "Keep drawing", () => {
    close();
    if (e.kind === "color") o.openColor(e);
    else o.openFree(e);
  }, "d-go");
  const trash = dBtn(svgIcon(ICONS.trash), "Throw away", () => {
    confirmBox({
      say: SAY.askDelete,
      face: svgIcon(ICONS.trash),
      danger: true,
      signal: o.signal,
      yes: () => {
        deleteEntry(e.id);
        sfx.whoosh();
        close();
        refresh();
      },
    });
  });
  const overlay = h(
    "div",
    { class: "overlay d-overlay g-view", role: "dialog", "aria-label": "Picture" },
    h(
      "div",
      { class: "g-view-card" },
      h("div", { class: "g-view-art" }, face),
      h("div", { class: "g-view-row" }, dBtn(svgIcon(ICONS.no), "Close", close), keepGoing, share, trash),
    ),
  );
  overlay.addEventListener("click", (ev) => {
    if (ev.target === overlay) close();
  });
  o.signal.addEventListener("abort", () => overlay.remove());
  document.body.append(overlay);
}

async function toBlob(e: Entry): Promise<Blob | null> {
  try {
    if (e.kind === "color") {
      const page = pageById.get(e.page);
      if (!page) return null;
      return await blobFromCanvas(await pageToCanvas(page, e.n === prepare(page).n ? e.fills : {}));
    }
    const img = await loadImage(e.img);
    if (!img) return null;
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    c.getContext("2d")!.drawImage(img, 0, 0);
    return await blobFromCanvas(c);
  } catch {
    return null;
  }
}

/** A few crayons standing in a box (the coloring-pages icon). */
export const crayonBox = (): string => ICONS.crayons;
