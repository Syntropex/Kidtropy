import { THEMES, type Theme } from "./data/items";
import { GAMES } from "./games/index";
import type { Game, Scene } from "./games/types";
import { grade, record, resetLearning, setGrade, starsFor } from "./learn/progress";
import { lessonById, lessonsFor, skillById, skillsFor, toolById, toolsFor } from "./learn/registry";
import { runLesson, runPractice, runQuiz } from "./learn/runner";
import { LEARN_SAY } from "./learn/say";
import { GRADES, type Grade } from "./learn/types";
import { sfx, unlockAudio } from "./lib/sfx";
import { cancelListening, micSupported, resetVoice, speak, stopSpeaking, unlockSpeech, voices } from "./lib/speech";
import { progress, resetProgress, saveSettings, settings } from "./lib/store";
import { line, SAY } from "./voice/lines";
import { bounce, h, icon, pic, stickerItems, updateStarCount } from "./lib/ui";



const app = document.getElementById("app")!;
let leave: AbortController | null = null;
let unlocked = false;

function header(opts: { back?: boolean; title?: string; icon?: string } = {}) {
  return h(
    "header",
    { class: "top" },
    opts.back
      ? h("a", { class: "home-btn", href: "#/", "aria-label": "Home", onclick: () => sfx.tap() }, icon("🏠"))
      : h("div", { class: "logo", "aria-label": "Kidtropy" }, h("span", { class: "logo-mark" }, icon("🚜")), h("span", { class: "logo-text" }, "Kidtropy")),
    opts.title ? h("div", { class: "title" }, opts.icon ? icon(opts.icon) : "", opts.title) : h("div", { class: "spacer" }),
    h("a", { class: "star-count", href: "#/stickers", "aria-label": "My stickers" }, icon("⭐"), h("span", { class: "n" }, String(progress.stars))),
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
      h("div", { class: "start-parade", "aria-hidden": "true" }, ...["🚚", "🦖", "🚜", "🐄", "🏎️"].map((g) => icon(g))),
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
    h("button", { class: `theme-chip${settings.themes.length === 0 ? " on" : ""}`, style: "--c:#5c6bc0", "data-theme": "all", "aria-label": "Everything" }, icon("🌈")),
    ...THEMES.map((t) => h("button", { class: `theme-chip${settings.themes.includes(t.id) ? " on" : ""}`, style: `--c:${t.color}`, "data-theme": t.id, "aria-label": t.label }, icon(t.icon))),
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
    void speak(id === "all" ? SAY.everything : line.theme(id, settings.themes.includes(id)));
  });

  const g = grade();
  const section = currentSection();
  const gradeRow = h(
    "div",
    { class: "grade-row", role: "group", "aria-label": "Grade" },
    ...GRADES.map((x) =>
      h(
        "button",
        {
          class: `grade-chip${x.id === g ? " on" : ""}`,
          style: `--c:${x.color}`,
          "aria-label": x.label,
          onclick: () => {
            setGrade(x.id);
            sfx.tap();
            void speak(x.say);
            home();
          },
        },
        x.short,
      ),
    ),
  );
  const tabs = h(
    "nav",
    { class: "section-tabs", role: "tablist" },
    ...SECTIONS.map((x) =>
      h(
        "button",
        {
          class: `section-tab${x.id === section ? " on" : ""}`,
          style: `--c:${x.color}`,
          role: "tab",
          "aria-selected": String(x.id === section),
          "aria-label": x.label,
          onclick: () => {
            setSection(x.id);
            sfx.tap();
            void speak(x.say);
            home();
          },
        },
        h("span", { class: "tab-icon", "aria-hidden": "true" }, icon(x.icon)),
        h("span", { class: "tab-label" }, x.label),
      ),
    ),
  );

  app.replaceChildren(
    header(),
    h("main", { class: "home" }, gradeRow, tabs, section === "play" ? themeRow : "", sectionTiles(section, g)),
    h(
      "footer",
      { class: "home-foot" },
      h("button", { class: "grownup-btn", "aria-label": "Grown-ups: press and hold" }, "🔒 Grown-ups (hold)"),
    ),
  );
  holdToOpen(app.querySelector(".grownup-btn")!, () => (location.hash = "#/grownups"));
}

// ---------------------------------------------------------------------------
// Home sections

type Section = "play" | "practice" | "learn" | "tools" | "quiz";
const SECTIONS: { id: Section; label: string; icon: string; color: string; say: string }[] = [
  { id: "play", label: "Play", icon: "🎮", color: "#ef5350", say: LEARN_SAY.play },
  { id: "practice", label: "Practice", icon: "🎯", color: "#29b6f6", say: LEARN_SAY.practiceSection },
  { id: "learn", label: "Learn", icon: "📚", color: "#7e57c2", say: LEARN_SAY.learnSection },
  { id: "tools", label: "Tools", icon: "🧰", color: "#26a69a", say: LEARN_SAY.toolsSection },
  { id: "quiz", label: "Quiz", icon: "✅", color: "#ffa726", say: LEARN_SAY.quizSection },
];
const AREA_COLORS: Record<string, string> = { math: "#29b6f6", reading: "#ff7043", world: "#66bb6a" };

function currentSection(): Section {
  try {
    const s = sessionStorage.getItem("kidtropy.section") as Section | null;
    if (s && SECTIONS.some((x) => x.id === s)) return s;
  } catch {
    /* ignore */
  }
  return "play";
}

function setSection(s: Section) {
  try {
    sessionStorage.setItem("kidtropy.section", s);
  } catch {
    /* ignore */
  }
}

function tile(href: string, title: string, glyph: string, color: string, i: number, extra?: HTMLElement) {
  return h(
    "a",
    { class: "game-tile pop-in", href, style: `--c:${color}; animation-delay:${i * 40}ms`, "aria-label": title, onclick: () => sfx.pop() },
    h("span", { class: "tile-icon", "aria-hidden": "true" }, icon(glyph)),
    h("span", { class: "tile-label" }, title),
    extra ?? "",
  );
}

function sectionTiles(section: Section, g: Grade): HTMLElement {
  const grid = (...tiles: HTMLElement[]) =>
    tiles.length ? h("div", { class: "game-grid" }, ...tiles) : h("p", { class: "empty-section" }, "Coming soon!");
  switch (section) {
    case "play":
      return grid(...GAMES.map((x, i) => tile(`#/${x.id}`, x.title, x.icon, x.color, i)));
    case "practice":
      return grid(...skillsFor(g).map((s, i) => tile(`#/skill/${s.id}`, s.title, s.icon, AREA_COLORS[s.area], i)));
    case "learn":
      return grid(...lessonsFor(g).map((l, i) => tile(`#/lesson/${l.id}`, l.title, l.icon, "#7e57c2", i)));
    case "tools":
      return grid(...toolsFor(g).map((t, i) => tile(`#/tool/${t.id}`, t.title, t.icon, "#26a69a", i)));
    case "quiz":
      return grid(
        ...skillsFor(g).map((s, i) => {
          const r = record(s.id);
          const stars = r.quizzes ? starsFor(r.best) : 0;
          const badge = h("span", { class: "tile-stars", "aria-label": `${stars} stars` }, ...[0, 1, 2].map((k) => h("i", { class: k < stars ? "on" : "" })));
          return tile(`#/quiz/${s.id}`, s.title, s.icon, AREA_COLORS[s.area], i, badge);
        }),
      );
  }
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
              h("button", { class: "sticker pop-in", "aria-label": i.name, onclick: (e: Event) => (bounce(e.currentTarget as Element), void speak(line.tapItem(i))) }, pic(i)),
            ),
          )
        : h("div", { class: "empty-book" }, h("div", { class: "big-emoji" }, icon("⭐")), h("p", {}, "Play games to win stars and stickers!")),
    ),
  );
  void speak(items.length ? SAY.stickers : SAY.noStickers);
}

function grownups() {
  const vs = voices();
  const row = (label: string, control: HTMLElement, help?: string) =>
    h("label", { class: "set-row" }, h("span", { class: "set-label" }, label, help ? h("small", {}, help) : false), control);

  const voiceSel = h(
    "select",
    {},
    h("option", { value: "" }, "Kidtropy voice (natural)"),
    h("option", { value: "device", selected: settings.voiceName === "device" }, "This device's voice"),
    ...vs.map((v) => h("option", { value: v.name, selected: v.name === settings.voiceName }, `${v.name} (${v.lang})`)));
  voiceSel.onchange = () => {
    settings.voiceName = voiceSel.value;
    saveSettings();
    resetVoice();
    void speak(SAY.voiceTest);
  };

  const rate = h("input", { type: "range", min: "0.6", max: "1.2", step: "0.05", value: String(settings.rate) });
  rate.onchange = () => {
    settings.rate = Number(rate.value);
    saveSettings();
    void speak(SAY.speedTest);
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

  const reset = h("button", { class: "danger" }, "Reset stars, stickers & scores");
  reset.onclick = () => {
    if (confirm("Erase all stars, stickers and quiz scores on this device?")) {
      resetProgress();
      resetLearning();
      updateStarCount();
      grownups();
    }
  };

  const report = h(
    "section",
    { class: "report" },
    h("h2", {}, "Progress"),
    h("p", { class: "report-note" }, "Best quiz score out of 10, and how many practice answers they got right."),
    ...GRADES.map((gr) =>
      h(
        "details",
        { open: gr.id === grade() },
        h("summary", {}, gr.label),
        h(
          "table",
          {},
          h("tr", {}, h("th", {}, "Skill"), h("th", {}, "Best quiz"), h("th", {}, "Practice")),
          ...skillsFor(gr.id).map((sk) => {
            const r = record(sk.id);
            const pct = r.quizzes ? Math.round((r.best / 10) * 100) : -1;
            return h(
              "tr",
              {},
              h("td", {}, sk.title),
              h("td", {}, r.quizzes ? h("span", { class: `score ${pct >= 80 ? "good" : pct >= 50 ? "ok" : "low"}` }, `${r.best}/10`) : "—"),
              h("td", {}, String(r.practiced || "—")),
            );
          }),
        ),
      ),
    ),
  );

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
        row("Talking speed", rate, "For the device voice."),
        row("Use microphone in Talk Time", mic, micSupported() ? "Your browser supports listening." : "This browser can't listen — try Safari on iPhone/iPad or Chrome on Android."),
        row("Sound effects", sfxBox),
        row("Choices in Find It & Colors", choices),
        row("Count It numbers", countMax),
        reset,
      ),
      report,
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
          h("li", {}, "In Talk Time, your kid taps the big microphone, then talks. Kids' voices are hard for computers to hear, so if they said it right and it didn't notice, tap 👍."),
          h("li", {}, "Talking needs microphone permission. On iPhone/iPad it also needs Siri & Dictation turned on (Settings → Siri, and Settings → General → Keyboard → Enable Dictation). Without it, Talk Time still works: say it out loud and tap 👍."),
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
        h("p", {}, "Voice: Kokoro (open source). Pictures: Microsoft Fluent Emoji (MIT) and original drawings. Animal and vehicle sounds: Freesound.org recordists (CC0)."),
        h("p", {}, "Free and open source: ", h("a", { href: "https://github.com/syntropex/kidtropy", target: "_blank", rel: "noopener" }, "github.com/syntropex/kidtropy")),
      ),
    ),
  );
}

function playGame(game: Game) {
  const ctl = new AbortController();
  leave = ctl;
  const root = h("main", { class: `game game-${game.id}` });
  app.replaceChildren(header({ back: true, title: game.title, icon: game.icon }), root);
  const cleanup = game.start({ root, signal: ctl.signal, alive: () => !ctl.signal.aborted });
  if (cleanup) ctl.signal.addEventListener("abort", cleanup);
}

function playScene(cls: string, title: string, glyph: string, start: (scene: Scene) => void | (() => void)) {
  const ctl = new AbortController();
  leave = ctl;
  const root = h("main", { class: `game ${cls}` });
  app.replaceChildren(header({ back: true, title, icon: glyph }), root);
  const cleanup = start({ root, signal: ctl.signal, alive: () => !ctl.signal.aborted });
  if (cleanup) ctl.signal.addEventListener("abort", cleanup);
}

/** #/skill/x, #/quiz/x, #/lesson/x, #/tool/x */
function learnRoute(kind: string, id: string): boolean {
  if (kind === "skill" || kind === "quiz") {
    const s = skillById.get(id);
    if (!s) return false;
    if (kind === "skill") playScene("learn", s.title, s.icon, (scene) => void runPractice(scene, s));
    else playScene("learn", s.title, "✅", (scene) => void runQuiz(scene, s, () => route()));
    return true;
  }
  if (kind === "lesson") {
    const l = lessonById.get(id);
    if (!l) return false;
    playScene("learn", l.title, l.icon, (scene) => void runLesson(scene, l, skillById));
    return true;
  }
  if (kind === "tool") {
    const t = toolById.get(id);
    if (!t) return false;
    playScene(`tool tool-${t.id}`, t.title, t.icon, (scene) => t.start(scene));
    return true;
  }
  return false;
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
  const [kind, sub] = id.split("/");
  document.body.dataset.screen = game || sub ? "game" : id || "home";
  if (sub && learnRoute(kind, sub)) {
    /* learning screen */
  } else if (game) {
    playGame(game);
  } else if (id === "stickers") {
    stickers();
  } else if (id === "grownups") {
    grownups();
  } else {
    home();
    if (!sessionStorage.getItem("kidtropy.greeted")) {
      sessionStorage.setItem("kidtropy.greeted", "1");
      void speak(SAY.greet);
    }
  }
  window.scrollTo(0, 0);
}

export function boot() {
  window.addEventListener("hashchange", route);
  route();
}
