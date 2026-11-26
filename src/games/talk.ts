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
import { ITEMS, type Item } from "../data/items";
import { findSpokenItem, heardItem } from "../lib/match";
import { sfx } from "../lib/sfx";
import { canListen, cancelListening, listen, micSupported, speak, stopSpeaking } from "../lib/speech";
import { bounce, capitalize, h, icon, makeDeck, pic, pickOne, pool, reward, shuffle, wait } from "../lib/ui";
import type { Game, Scene } from "./types";
import { ASK, HINT_LEADS, JOKES, line, REVEAL_LEADS, SAY, TALK_YES } from "../voice/lines";


export const talk: Game = {
  id: "talk",
  title: "Talk Time",
  icon: "🎤",
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
        h("span", { class: "mode-icon" }, icon("❓")),
        h("span", { class: "mode-label" }, "What is it?"),
      ),
      h(
        "button",
        { class: "mode-btn", style: "--c:#26a69a", onclick: () => showMode(scene), "aria-label": "Show me!" },
        h("span", { class: "mode-icon" }, icon("🔍")),
        h("span", { class: "mode-label" }, "Show me!"),
      ),
    ),
    !micSupported()
      ? h("p", { class: "grownup-note" }, "Grown-ups: this browser can't listen, so say the answers out loud and tap 👍. Safari on iPhone/iPad and Chrome on Android can listen.")
      : "",
  );
  void speak(SAY.talkMenu);
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
  const micSlot = h("div", { class: "mic-slot" });
  const controls = h("div", { class: "talk-controls" });
  root.replaceChildren(h("div", { class: "talk-wrap" }, stage, word, heardText, micSlot, controls));

  // The child is in charge: nothing moves on until they talk or tap.
  // Listening always starts from a tap, because iPhone/iPad only allow the
  // microphone right after a tap.
  async function play() {
    const id = ++round;
    const live = () => scene.alive() && id === round;
    const item = next();
    let solved = false;
    let tries = 0;
    let listening = false;
    let nudge = 0;

    const picture = h("button", { class: "talk-pic pop-in", "aria-label": "Picture. Tap to hear the question again." }, pic(item));
    stage.replaceChildren(picture);
    word.textContent = "";
    heardText.textContent = "";

    const remind = () => {
      clearTimeout(nudge);
      nudge = window.setTimeout(() => {
        if (live() && !solved && !listening) void speak(canListen() ? SAY.tapMic : SAY.sayItOutLoud);
      }, 14000);
    };
    scene.signal.addEventListener("abort", () => clearTimeout(nudge));

    const win = async () => {
      if (solved || !live()) return;
      solved = true;
      clearTimeout(nudge);
      cancelListening();
      micBtn.classList.remove("listening");
      micBtn.classList.add("hidden");
      word.textContent = capitalize(item.name);
      bounce(picture);
      void reward(picture);
      await speak(line.talkWin(item, pickOne(TALK_YES)));
      if (!live()) return;
      await wait(900);
      if (live()) void play();
    };

    const reveal = async (lead: (typeof REVEAL_LEADS)[number]) => {
      word.textContent = capitalize(item.name);
      await speak(line.reveal(item, lead));
      remind();
    };

    picture.onclick = async () => {
      bounce(picture);
      await speak(solved ? line.tapItem(item) : pickOne(ASK));
    };

    const micBtn = h(
      "button",
      { class: "mic-btn", "aria-label": "Tap and talk" },
      h("span", { class: "rings", "aria-hidden": "true" }, h("i"), h("i"), h("i")),
      h("span", { class: "mic-icon" }, icon("🎤")),
    );

    micBtn.onclick = async () => {
      if (solved || listening || !live()) return;
      listening = true;
      clearTimeout(nudge);
      stopSpeaking();
      heardText.textContent = "";
      micBtn.classList.add("listening");
      // Start right away (inside the tap) so iOS allows it.
      const pending = listen({
        timeoutMs: 8000,
        onHeard: (alts) => {
          heardText.textContent = alts[0] ? `“${alts[0]}”` : "";
          return heardItem(alts, item);
        },
      });
      sfx.listen();
      const res = await pending;
      listening = false;
      micBtn.classList.remove("listening");
      if (!live() || solved) return;
      if (heardItem(res.alternatives, item)) return win();
      if (res.reason === "blocked" || res.reason === "error") {
        heardText.textContent =
          res.reason === "blocked"
            ? "Grown-ups: allow the microphone (and on iPhone/iPad turn on Siri & Dictation) to play with talking. You can still tap 👍."
            : "Grown-ups: the microphone isn't working right now. You can still say it out loud and tap 👍.";
        micBtn.classList.add("hidden");
        thumbs.classList.add("big");
        await speak(SAY.sayItOutLoud);
        return;
      }
      if (!res.alternatives.length) {
        await speak(SAY.didntHear);
        remind();
        return;
      }
      tries++;
      if (tries === 1) await speak(line.hint(item, HINT_LEADS[0]));
      else if (tries === 2) await reveal("Good try!");
      else await speak(SAY.tapArrow);
      remind();
    };

    const thumbs = h("button", { class: "round-btn yes", "aria-label": "They said it!", onclick: () => win() }, icon("👍"));
    controls.replaceChildren(
      h("button", { class: "round-btn hint", "aria-label": "Hint: hear the answer", onclick: () => !solved && reveal("Here's a hint!") }, icon("💡")),
      thumbs,
      h("button", { class: "round-btn skip", "aria-label": "Next picture", onclick: () => (sfx.whoosh(), play()) }, icon("➡️")),
    );
    const mic = canListen();
    micSlot.replaceChildren(mic ? micBtn : "");
    thumbs.classList.toggle("big", !mic);

    await wait(300);
    if (!live()) return;
    const ask = pickOne(ASK);
    await speak(`${round === 1 ? SAY.letsPlay : ""} ${ask} ${mic ? SAY.tapMic : SAY.sayItOutLoud}`);
    if (live() && !solved) remind();
  }

  scene.signal.addEventListener("abort", () => {
    round++;
    cancelListening();
  });
  void play();
}

// ---------------------------------------------------------------------------
// "Show me!" — the child talks, Kidtropy shows.


function showMode(scene: Scene) {
  const { root } = scene;
  const stage = h("div", { class: "talk-stage" });
  const word = h("div", { class: "big-word", "aria-live": "polite" });
  const heardText = h("div", { class: "heard-text" });
  const suggest = h("div", { class: "suggest-row" });
  const micBtn = h("button", { class: "mic-btn", "aria-label": "Tap and talk" }, h("span", { class: "rings", "aria-hidden": "true" }, h("i"), h("i"), h("i")), h("span", { class: "mic-icon" }, icon("🎤")));
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
      void speak(line.tapItem(item));
    };
    stage.replaceChildren(picture);
    word.textContent = capitalize(item.name);
    sfx.pop();
    await speak(line.showItem(item));
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
    if (/\b(hi|hello|hey|hiya)\b/.test(text)) return speak(SAY.hello);
    if (/your name|who are you/.test(text)) return speak(SAY.myName);
    if (/\broar\b/.test(text)) return speak(SAY.roar);
    if (alts[0]) return speak(SAY.dontKnow);
    return speak(SAY.didntHear);
  };

  micBtn.onclick = async () => {
    if (busy) return;
    busy = true;
    micBtn.classList.add("listening");
    sfx.listen();
    heardText.textContent = "";
    const res = await listen({
      timeoutMs: 8000,
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
  stage.replaceChildren(h("div", { class: "talk-hello pop-in", "aria-hidden": "true" }, icon("👂")));
  void speak(mic ? SAY.showIntroMic : SAY.showIntroTap);
}
