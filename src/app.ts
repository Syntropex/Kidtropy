import { THEMES, type Theme } from "./data/items";
import { abc } from "./games/abc";
import { colors } from "./games/colors";
import { count } from "./games/count";
import { dig } from "./games/dig";
import { find } from "./games/find";
import { race } from "./games/race";
import { sounds } from "./games/sounds";
import { talk } from "./games/talk";
import type { Game } from "./games/types";
import { sfx, unlockAudio } from "./lib/sfx";
import { cancelListening, micSupported, resetVoice, speak, stopSpeaking, unlockSpeech, voices } from "./lib/speech";
import { progress, resetProgress, saveSettings, settings } from "./lib/store";
import { bounce, h, pic, stickerItems, updateStarCount } from "./lib/ui";

export const GAMES: Game[] = [talk, find, count, colors, dig, race, abc, sounds];

const app = document.getElementById("app")!;
let leave: AbortController | null = null;
let unlocked = false;

function header(opts: { back?: boolean; title?: string } = {}) {
  return h(
    "header",
    { class: "top" },
    opts.back
      ? h("a", { class: "home-btn", href: "#/", "aria-label": "Home", onclick: () => sfx.tap() }, "🏠")
      : h("div", { class: "logo", "aria-label": "Kidtropy" }, h("span", { class: "logo-mark" }, "🚜"), h("span", { class: "logo-text" }, "Kidtropy")),
    opts.title ? h("div", { class: "title" }, opts.title) : h("div", { class: "spacer" }),
    h("a", { class: "star-count", href: "#/stickers", "aria-label": "My stickers" }, "⭐", h("span", { class: "n" }, String(progress.stars))),
  );
}

// ---------------------------------------------------------------------------
// Screens

function startScreen() {
  const go = () => {
    unlocked = true;
    unlockAudio();
    unlockSpeech();
    sfx.fanfare();
    route();
  };
  app.replaceChildren(
    h(
      "div",
      { class: "start" },
      h("div", { class: "start-parade", "aria-hidden": "true" }, "🚚🦖🚜🐄🏎️"),
      h("h1", { class: "start-title" }, "Kidtropy"),
      h("button", { class: "play-btn", onclick: go, "aria-label": "Play" }, "▶"),
      h("p", { class: "start-note" }, "Turn the sound on! 🔊"),
    ),
  );
}

function home() {
  const themeRow = h(
    "div",
    { class: "theme-row", role: "group", "aria-label": "What do you like?" },
    h("button", { class: `theme-chip${settings.themes.length === 0 ? " on" : ""}`, style: "--c:#5c6bc0", "data-theme": "all", "aria-label": "Everything" }, "🌈"),
    ...THEMES.map((t) => h("button", { class: `theme-chip${settings.themes.includes(t.id) ? " on" : ""}`, style: `--c:${t.color}`, "data-theme": t.id, "aria-label": t.label }, t.icon)),
  );
  themeRow.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(".theme-chip");
    if (!btn) return;
    const id = btn.dataset.theme as Theme | "all";
    if (id === "all") settings.themes = [];
    else if (settings.themes.includes(id)) settings.themes = settings.themes.filter((t) => t !== id);
    else settings.themes = [...settings.themes, id];
    saveSettings();
    themeRow.querySelectorAll<HTMLElement>(".theme-chip").forEach((c) => {
      const t = c.dataset.theme;
      c.classList.toggle("on", t === "all" ? settings.themes.length === 0 : settings.themes.includes(t as Theme));
    });
    bounce(btn);
    sfx.tap();
    const label = id === "all" ? "Everything!" : THEMES.find((t) => t.id === id)!.label;
    void speak(id !== "all" && !settings.themes.includes(id) ? `No more ${label}` : `${label}!`);
  });

  const tiles = h(
    "nav",
    { class: "game-grid" },
    ...GAMES.map((g, i) =>
      h(
        "a",
        { class: "game-tile pop-in", href: `#/${g.id}`, style: `--c:${g.color}; animation-delay:${i * 50}ms`, "aria-label": g.title, onclick: () => sfx.pop() },
        h("span", { class: "tile-icon", "aria-hidden": "true" }, g.icon),
        h("span", { class: "tile-label" }, g.title),
      ),
    ),
  );

  app.replaceChildren(
    header(),
    h("main", { class: "home" }, themeRow, tiles),
    h(
      "footer",
      { class: "home-foot" },
      h("button", { class: "grownup-btn", "aria-label": "Grown-ups: press and hold" }, "🔒 Grown-ups (hold)"),
    ),
  );
  holdToOpen(app.querySelector(".grownup-btn")!, () => (location.hash = "#/grownups"));
}

function holdToOpen(el: HTMLElement, open: () => void) {
  let timer = 0;
  const start = (e: Event) => {
    e.preventDefault();
    el.classList.add("holding");
    timer = window.setTimeout(() => {
      el.classList.remove("holding");
      open();
    }, 2000);
  };
  const stop = () => {
    clearTimeout(timer);
    el.classList.remove("holding");
  };
  el.addEventListener("pointerdown", start);
  el.addEventListener("pointerup", stop);
  el.addEventListener("pointerleave", stop);
  el.addEventListener("pointercancel", stop);
  el.addEventListener("contextmenu", (e) => e.preventDefault());
}

function stickers() {
  const items = stickerItems();
  app.replaceChildren(
    header({ back: true, title: "My Stickers" }),
    h(
      "main",
      { class: "sticker-book" },
      items.length
        ? h(
            "div",
            { class: "sticker-grid" },
            ...items.map((i) =>
              h("button", { class: "sticker pop-in", "aria-label": i.name, onclick: (e: Event) => (bounce(e.currentTarget as Element), void speak(`${i.name}! ${i.sound ?? ""}`)) }, pic(i)),
            ),
          )
        : h("div", { class: "empty-book" }, h("div", { class: "big-emoji" }, "⭐"), h("p", {}, "Play games to win stars and stickers!")),
    ),
  );
  void speak(items.length ? `You have ${items.length} sticker${items.length === 1 ? "" : "s"}! Tap them!` : "Play games to get stickers!");
}

function grownups() {
  const vs = voices();
  const row = (label: string, control: HTMLElement, help?: string) =>
    h("label", { class: "set-row" }, h("span", { class: "set-label" }, label, help ? h("small", {}, help) : false), control);

  const voiceSel = h("select", {}, h("option", { value: "" }, "Automatic"), ...vs.map((v) => h("option", { value: v.name, selected: v.name === settings.voiceName }, `${v.name} (${v.lang})`)));
  voiceSel.onchange = () => {
    settings.voiceName = voiceSel.value;
    saveSettings();
    resetVoice();
    void speak("Hi! This is my voice!");
  };

  const rate = h("input", { type: "range", min: "0.6", max: "1.2", step: "0.05", value: String(settings.rate) });
  rate.onchange = () => {
    settings.rate = Number(rate.value);
    saveSettings();
    void speak("Is this a good speed?");
  };

  const mic = h("input", { type: "checkbox", checked: settings.useMic });
  mic.onchange = () => {
    settings.useMic = mic.checked;
    saveSettings();
  };

  const sfxBox = h("input", { type: "checkbox", checked: settings.sfx });
  sfxBox.onchange = () => {
    settings.sfx = sfxBox.checked;
    saveSettings();
  };

  const choices = h("select", {}, ...[2, 3, 4, 6].map((n) => h("option", { value: String(n), selected: n === settings.choices }, `${n} pictures`)));
  choices.onchange = () => {
    settings.choices = Number(choices.value);
    saveSettings();
  };

  const countMax = h("select", {}, ...[3, 5, 10].map((n) => h("option", { value: String(n), selected: n === settings.countMax }, `Up to ${n}`)));
  countMax.onchange = () => {
    settings.countMax = Number(countMax.value);
    saveSettings();
  };

  const reset = h("button", { class: "danger" }, "Reset stars & stickers");
  reset.onclick = () => {
    if (confirm("Erase all stars and stickers on this device?")) {
      resetProgress();
      updateStarCount();
    }
  };

  app.replaceChildren(
    header({ back: true, title: "Grown-ups" }),
    h(
      "main",
      { class: "grownups" },
      h(
        "section",
        {},
        h("h2", {}, "Settings"),
        row("Voice", voiceSel),
        row("Talking speed", rate),
        row("Use microphone in Talk Time", mic, micSupported() ? "Your browser supports listening." : "This browser can't listen — try Safari on iPhone/iPad or Chrome on Android."),
        row("Sound effects", sfxBox),
        row("Choices in Find It & Colors", choices),
        row("Count It numbers", countMax),
        reset,
      ),
      h(
        "section",
        {},
        h("h2", {}, "Tips"),
        h(
          "ul",
          {},
          h("li", {}, "Tap the theme bubbles on the home screen to pick what your kid loves (trucks, diggers, dinosaurs…). Pick none for everything."),
          h("li", {}, "Install it: in Safari tap Share → Add to Home Screen. It then works full-screen and offline (except listening)."),
          h("li", {}, "For focused play on iPad/iPhone, turn on Guided Access (Settings → Accessibility)."),
          h("li", {}, "In Talk Time, kids' voices are hard for computers to hear. If they said it right and it didn't notice, tap 👍."),
        ),
      ),
      h(
        "section",
        {},
        h("h2", {}, "Privacy"),
        h(
          "p",
          {},
          "Kidtropy has no accounts, ads, tracking or analytics. Stars and settings are stored only on this device. When the microphone is used, the browser's own speech service (Apple or Google) turns speech into text; Kidtropy never records or uploads audio.",
        ),
        h("p", {}, "Free and open source: ", h("a", { href: "https://github.com/syntropex/kidtropy", target: "_blank", rel: "noopener" }, "github.com/syntropex/kidtropy")),
      ),
    ),
  );
}

function playGame(game: Game) {
  const ctl = new AbortController();
  leave = ctl;
  const root = h("main", { class: `game game-${game.id}` });
  app.replaceChildren(header({ back: true, title: `${game.icon} ${game.title}` }), root);
  const cleanup = game.start({ root, signal: ctl.signal, alive: () => !ctl.signal.aborted });
  if (cleanup) ctl.signal.addEventListener("abort", cleanup);
}

// ---------------------------------------------------------------------------
// Router (hash based so it works on any static host)

export function route() {
  leave?.abort();
  leave = null;
  stopSpeaking();
  cancelListening();
  document.querySelectorAll("body > .overlay").forEach((o) => o.remove());

  if (!unlocked) return startScreen();
  const id = location.hash.replace(/^#\/?/, "");
  const game = GAMES.find((g) => g.id === id);
  document.body.dataset.screen = game ? "game" : id || "home";
  if (game) {
    playGame(game);
  } else if (id === "stickers") {
    stickers();
  } else if (id === "grownups") {
    grownups();
  } else {
    home();
    if (!sessionStorage.getItem("kidtropy.greeted")) {
      sessionStorage.setItem("kidtropy.greeted", "1");
      void speak("Hi! Let's play! Pick a game!");
    }
  }
  window.scrollTo(0, 0);
}

export function boot() {
  window.addEventListener("hashchange", route);
  route();
}
