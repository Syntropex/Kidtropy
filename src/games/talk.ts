/**
 * Talk Time — the "Alexa-style" game.
 *
 *  - "What is it?": Kidtropy shows a picture, asks what it is, and listens.
 *  - "Show me!":    the child says a word ("dinosaur!") and Kidtropy shows it.
 *
 * Speech recognition is unreliable with small voices, so:
 *  - matching is very forgiving (see lib/match.ts),
 *  - there is always a big 👍 button so a grown-up (or the kid) can say
 *    "they got it",
 *  - and when there is no mic at all, the game still works as a
 *    say-it-out-loud picture quiz.
 */
import { ITEMS, withArticle, type Item } from "../data/items";
import { findSpokenItem, heardItem } from "../lib/match";
import { sfx } from "../lib/sfx";
import { canListen, cancelListening, listen, micSupported, speak } from "../lib/speech";
import { bounce, capitalize, h, makeDeck, pic, pickOne, pool, reward, shuffle, wait } from "../lib/ui";
import type { Game, Scene } from "./types";

const ASK = ["What is this?", "What's this one?", "Ooh! What is it?", "Can you tell me what this is?", "Do you know what this is?"];
const YES = ["Yes!", "You got it!", "That's right!", "Great job!", "Wow, you're so smart!", "Yay!"];

function earsIndicator() {
  return h(
    "div",
    { class: "listen-badge", "aria-live": "polite" },
    h("div", { class: "rings", "aria-hidden": "true" }, h("i"), h("i"), h("i")),
    h("div", { class: "mic", "aria-hidden": "true" }, "🎤"),
  );
}

export const talk: Game = {
  id: "talk",
  title: "Talk Time",
  icon: "🗣️",
  color: "#7e57c2",
  start(scene) {
    menu(scene);
  },
};

function menu(scene: Scene) {
  const { root } = scene;
  root.replaceChildren(
    h(
      "div",
      { class: "talk-menu" },
      h(
        "button",
        { class: "mode-btn", style: "--c:#7e57c2", onclick: () => askMode(scene), "aria-label": "What is it?" },
        h("span", { class: "mode-icon" }, "❓"),
        h("span", { class: "mode-label" }, "What is it?"),
      ),
      h(
        "button",
        { class: "mode-btn", style: "--c:#26a69a", onclick: () => showMode(scene), "aria-label": "Show me!" },
        h("span", { class: "mode-icon" }, "🔍"),
        h("span", { class: "mode-label" }, "Show me!"),
      ),
    ),
    !micSupported()
      ? h("p", { class: "grownup-note" }, "Grown-ups: this browser can't listen, so say the answers out loud and tap 👍. Safari on iPhone/iPad and Chrome on Android can listen.")
      : "",
  );
  void speak("Do you want me to ask you, or do you want to tell me?");
}

// ---------------------------------------------------------------------------
// "What is it?"

function askMode(scene: Scene) {
  const { root } = scene;
  const next = makeDeck(pool);
  let round = 0;

  const stage = h("div", { class: "talk-stage" });
  const word = h("div", { class: "big-word", "aria-live": "polite" });
  const heardText = h("div", { class: "heard-text" });
  const badgeSlot = h("div", { class: "badge-slot" });
  const controls = h("div", { class: "talk-controls" });
  root.replaceChildren(h("div", { class: "talk-wrap" }, stage, word, badgeSlot, heardText, controls));

  async function play() {
    const id = ++round;
    const live = () => scene.alive() && id === round;
    const item = next();
    let solved = false;

    const picture = h("button", { class: "talk-pic pop-in", "aria-label": "Picture. Tap to hear the question again." }, pic(item));
    stage.replaceChildren(picture);
    word.textContent = "";
    heardText.textContent = "";
    badgeSlot.replaceChildren();

    const win = async () => {
      if (solved || !live()) return;
      solved = true;
      cancelListening();
      badgeSlot.replaceChildren();
      word.textContent = capitalize(item.name);
      bounce(picture);
      void reward(picture);
      await speak(`${pickOne(YES)} It's ${withArticle(item)}! ${item.sound ?? ""} ${item.fact ?? ""}`);
      if (!live()) return;
      await wait(900);
      if (live()) void play();
    };

    const reveal = async (lead: string) => {
      word.textContent = capitalize(item.name);
      await speak(`${lead} It's ${withArticle(item)}! Can you say ${item.name}?`);
    };

    picture.onclick = async () => {
      bounce(picture);
      if (solved) {
        await speak(`${capitalize(withArticle(item))}! ${item.sound ?? ""}`);
      } else {
        await speak(pickOne(ASK));
      }
    };

    controls.replaceChildren(
      h("button", { class: "round-btn hint", "aria-label": "Hint: hear the answer", onclick: () => !solved && reveal("Here's a hint!") }, "💡"),
      h("button", { class: "round-btn yes", "aria-label": "They said it!", onclick: () => win() }, "👍"),
      h("button", { class: "round-btn skip", "aria-label": "Next picture", onclick: () => (sfx.whoosh(), play()) }, "➡️"),
    );

    await wait(350);
    if (!live()) return;
    await speak(round === 1 ? `Let's play! ${pickOne(ASK)}` : pickOne(ASK));

    if (!canListen()) {
      // No microphone: let them say it out loud, then tell them the answer.
      await wait(3500);
      if (!live() || solved) return;
      await reveal("Did you say it?");
      return;
    }

    for (let attempt = 0; attempt < 2 && live() && !solved; attempt++) {
      badgeSlot.replaceChildren(earsIndicator());
      sfx.listen();
      const res = await listen({
        timeoutMs: 6500,
        onHeard: (alts) => {
          heardText.textContent = alts[0] ? `“${alts[0]}”` : "";
          return heardItem(alts, item);
        },
      });
      if (!live() || solved) return;
      badgeSlot.replaceChildren();
      if (heardItem(res.alternatives, item)) return win();
      if (res.reason === "blocked") {
        heardText.textContent = "Grown-ups: allow the microphone to play with talking. You can still tap 👍.";
        await reveal("Hmm!");
        return;
      }
      if (attempt === 0) {
        const lead = res.alternatives.length ? "Ooh, good try!" : "I'm listening!";
        await speak(`${lead} Here's a hint. It starts with ${firstSound(item)}...`);
      } else {
        await reveal("Good try!");
        if (!live() || solved) return;
        // One last listen in case they repeat it.
        badgeSlot.replaceChildren(earsIndicator());
        sfx.listen();
        const last = await listen({ timeoutMs: 5000, onHeard: (alts) => heardItem(alts, item) });
        if (!live() || solved) return;
        badgeSlot.replaceChildren();
        if (heardItem(last.alternatives, item)) return win();
        await speak("Let's try another one!");
        await wait(500);
        if (live() && !solved) void play();
      }
    }
  }

  const stop = () => {
    round++;
    cancelListening();
  };
  scene.signal.addEventListener("abort", stop);
  void play();
}

function firstSound(item: Item): string {
  // "fire truck" -> "fff"; gives the child a phonics nudge.
  const c = item.name.replace(/^t\. /i, "t").charAt(0).toLowerCase();
  const sounds: Record<string, string> = {
    a: "ah", b: "buh", c: "kuh", d: "duh", e: "eh", f: "fff", g: "guh", h: "hhh", i: "ih", j: "juh", k: "kuh", l: "lll", m: "mmm",
    n: "nnn", o: "oh", p: "puh", q: "kwuh", r: "rrr", s: "sss", t: "tuh", u: "uh", v: "vvv", w: "wuh", x: "ks", y: "yuh", z: "zzz",
  };
  if (/^(ch|sh|th)/i.test(item.name)) return item.name.slice(0, 2);
  return sounds[c] ?? c;
}

// ---------------------------------------------------------------------------
// "Show me!" — the child talks, Kidtropy shows.

const JOKES = [
  "Why did the cow cross the road? To get to the moo-vies!",
  "What do you call a sleeping dinosaur? A dino-snore!",
  "What kind of truck sings? A truck that rocks and rolls!",
  "Why do ducks have tail feathers? To cover their butt quacks!",
  "What does a construction worker eat? Dig-gestive cookies!",
];

function showMode(scene: Scene) {
  const { root } = scene;
  const stage = h("div", { class: "talk-stage" });
  const word = h("div", { class: "big-word", "aria-live": "polite" });
  const heardText = h("div", { class: "heard-text" });
  const suggest = h("div", { class: "suggest-row" });
  const micBtn = h("button", { class: "mic-btn", "aria-label": "Tap and talk" }, h("span", { class: "rings", "aria-hidden": "true" }, h("i"), h("i"), h("i")), h("span", { class: "mic-icon" }, "🎤"));
  root.replaceChildren(h("div", { class: "talk-wrap" }, stage, word, heardText, micBtn, suggest));

  const mic = canListen();
  if (!mic) micBtn.classList.add("hidden");
  let busy = false;
  let shown: Item | null = null;

  const showItem = async (item: Item) => {
    shown = item;
    const picture = h("button", { class: "talk-pic pop-in", "aria-label": item.name }, pic(item));
    picture.onclick = () => {
      bounce(picture);
      void speak(`${capitalize(withArticle(item))}! ${item.sound ?? ""}`);
    };
    stage.replaceChildren(picture);
    word.textContent = capitalize(item.name);
    sfx.pop();
    await speak(`Here's ${withArticle(item)}! ${item.sound ?? ""} ${item.fact ?? ""}`);
    refreshSuggestions();
  };

  const refreshSuggestions = () => {
    const ideas = shuffle(pool().filter((i) => i !== shown)).slice(0, 4);
    suggest.replaceChildren(
      ...ideas.map((i) =>
        h("button", { class: "chip", "aria-label": i.name, onclick: () => !busy && void showItem(i) }, pic(i)),
      ),
    );
  };

  const handle = async (alts: string[]) => {
    const text = alts.join(" ").toLowerCase();
    const item = findSpokenItem(alts, ITEMS);
    if (item) return showItem(item);
    if (/joke|funny|laugh/.test(text)) return speak(pickOne(JOKES));
    if (/\b(hi|hello|hey|hiya)\b/.test(text)) return speak("Hi friend! Say the name of something and I'll show you!");
    if (/your name|who are you/.test(text)) return speak("I'm Kidtropy! I love trucks and dinosaurs!");
    if (/\broar\b/.test(text)) return speak("ROAR! That was a big dinosaur roar!");
    if (alts[0]) return speak(`Hmm, I don't know ${alts[0]} yet! Try saying dinosaur, tractor, or cow!`);
    return speak("I didn't hear you. Tap the button and talk to me!");
  };

  micBtn.onclick = async () => {
    if (busy) return;
    busy = true;
    micBtn.classList.add("listening");
    sfx.listen();
    heardText.textContent = "";
    const res = await listen({
      timeoutMs: 6000,
      onHeard: (alts) => {
        heardText.textContent = alts[0] ? `“${alts[0]}”` : "";
        return !!findSpokenItem(alts, ITEMS);
      },
    });
    micBtn.classList.remove("listening");
    if (!scene.alive()) return;
    if (res.reason === "blocked") {
      heardText.textContent = "Grown-ups: allow the microphone to use Show Me. Or tap the pictures below.";
      micBtn.classList.add("hidden");
    } else {
      await handle(res.alternatives);
    }
    busy = false;
  };

  scene.signal.addEventListener("abort", () => cancelListening());

  refreshSuggestions();
  stage.replaceChildren(h("div", { class: "talk-hello pop-in", "aria-hidden": "true" }, "👂"));
  void speak(mic ? "Tap the microphone and tell me something to show you! Like dinosaur, or excavator!" : "Tap a picture and I'll tell you all about it!");
}
