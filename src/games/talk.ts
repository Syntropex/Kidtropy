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
import { canListen, cancelListening, listen, micSupported, speak } from "../lib/speech";
import { bounce, capitalize, h, icon, makeDeck, pic, pickOne, pool, reward, shuffle, wait } from "../lib/ui";
import type { Game, Scene } from "./types";
import { ASK, HINT_LEADS, JOKES, line, REVEAL_LEADS, SAY, TALK_YES } from "../voice/lines";

function earsIndicator() {
  return h(
    "div",
    { class: "listen-badge", "aria-live": "polite" },
    h("div", { class: "rings", "aria-hidden": "true" }, h("i"), h("i"), h("i")),
    h("div", { class: "mic", "aria-hidden": "true" }, icon("🎤")),
  );
}

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
      await speak(line.talkWin(item, pickOne(TALK_YES)));
      if (!live()) return;
      await wait(900);
      if (live()) void play();
    };

    const reveal = async (lead: (typeof REVEAL_LEADS)[number]) => {
      word.textContent = capitalize(item.name);
      await speak(line.reveal(item, lead));
    };

    picture.onclick = async () => {
      bounce(picture);
      if (solved) {
        await speak(line.tapItem(item));
      } else {
        await speak(pickOne(ASK));
      }
    };

    controls.replaceChildren(
      h("button", { class: "round-btn hint", "aria-label": "Hint: hear the answer", onclick: () => !solved && reveal("Here's a hint!") }, icon("💡")),
      h("button", { class: "round-btn yes", "aria-label": "They said it!", onclick: () => win() }, icon("👍")),
      h("button", { class: "round-btn skip", "aria-label": "Next picture", onclick: () => (sfx.whoosh(), play()) }, icon("➡️")),
    );

    await wait(350);
    if (!live()) return;
    await speak(round === 1 ? `${SAY.letsPlay} ${pickOne(ASK)}` : pickOne(ASK));

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
        await speak(line.hint(item, HINT_LEADS[res.alternatives.length ? 0 : 1]));
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
        await speak(SAY.tryAnother);
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
  stage.replaceChildren(h("div", { class: "talk-hello pop-in", "aria-hidden": "true" }, icon("👂")));
  void speak(mic ? SAY.showIntroMic : SAY.showIntroTap);
}
