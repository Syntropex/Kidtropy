/**
 * Runs skills (as endless practice or a 10-question quiz) and lessons.
 */
import type { Scene } from "../games/types";
import { sfx } from "../lib/sfx";
import { speak } from "../lib/speech";
import { bounce, choiceGrid, confetti, h, icon, pickOne, reward, wait, wiggle } from "../lib/ui";
import { noteQuiz, notePractice, QUIZ_LENGTH, starsFor } from "./progress";
import { LEARN_SAY, PRAISE, quizScore } from "./say";
import type { Lesson, Question, Skill } from "./types";

type Mode = "practice" | "quiz";

/** Avoid asking the exact same question twice in a row. */
function fresh(make: () => Question, last?: Question): Question {
  let q = make();
  for (let i = 0; i < 6 && last && q.prompt === last.prompt && q.show === undefined; i++) q = make();
  return q;
}

/**
 * Ask one question inside `host`. Resolves true if answered right the first time.
 * In practice mode, wrong answers wiggle and the child tries again.
 * In quiz mode, a wrong answer shows the right one and moves on.
 */
export function ask(scene: Scene, host: HTMLElement, q: Question, mode: Mode, skillId?: string): Promise<boolean> {
  return new Promise((resolve) => {
    const n = q.choices.length;
    const prompt = h("button", { class: "prompt-btn", "aria-label": "Hear it again", onclick: () => speak(q.prompt) }, icon("🔊"));
    const grid = h("div", { class: `choice-grid q-${q.style ?? "pics"}` });
    choiceGrid(grid, n);
    let firstTry = true;
    let done = false;

    const buttons = q.choices.map((c) => {
      const content = c.view();
      const b = h("button", { class: "choice pop-in", "aria-label": c.label }, content);
      b.onclick = async () => {
        if (done || !scene.alive()) return;
        if (c.correct) {
          done = true;
          bounce(b);
          b.classList.add("right");
          grid.querySelectorAll(".choice").forEach((x) => x !== b && x.classList.add("fade"));
          if (mode === "practice") {
            void reward(b);
            if (skillId) notePractice(skillId);
          } else {
            sfx.correct();
            confetti(18, center(b));
          }
          await speak(`${pickOne(PRAISE)} ${q.praise ?? ""}`);
          if (scene.alive()) resolve(firstTry);
        } else if (mode === "practice") {
          firstTry = false;
          wiggle(b);
          b.classList.add("tried");
          await speak(`${c.say ?? ""} ${q.hint ?? q.prompt}`);
        } else {
          done = true;
          firstTry = false;
          sfx.tap();
          b.classList.add("tried");
          const right = buttons[q.choices.findIndex((x) => x.correct)];
          right?.classList.add("right");
          grid.querySelectorAll(".choice").forEach((x) => x !== right && x !== b && x.classList.add("fade"));
          await speak(`${LEARN_SAY.itWasThis} ${q.praise ?? ""}`);
          if (scene.alive()) resolve(false);
        }
      };
      return b;
    });
    grid.append(...buttons);
    host.replaceChildren(h("div", { class: "q-wrap" }, prompt, q.show ? h("div", { class: "q-show" }, q.show()) : "", grid));
    void speak(q.prompt);
  });
}

function center(el: Element) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export async function runPractice(scene: Scene, skill: Skill) {
  const host = h("div", { class: "q-host" });
  scene.root.replaceChildren(host);
  await speak(skill.intro);
  let last: Question | undefined;
  while (scene.alive()) {
    const q = fresh(() => skill.make(), last);
    last = q;
    await ask(scene, host, q, "practice", skill.id);
    await wait(500);
  }
}

export async function runQuiz(scene: Scene, skill: Skill, again: () => void) {
  const dots = h("div", { class: "quiz-dots", "aria-hidden": "true" }, ...Array.from({ length: QUIZ_LENGTH }, () => h("i")));
  const host = h("div", { class: "q-host" });
  scene.root.replaceChildren(h("div", { class: "quiz-wrap" }, dots, host));
  await speak(LEARN_SAY.quizStart);
  let score = 0;
  let last: Question | undefined;
  for (let i = 0; i < QUIZ_LENGTH && scene.alive(); i++) {
    dots.children[i]?.classList.add("now");
    const q = fresh(() => skill.make(), last);
    last = q;
    const ok = await ask(scene, host, q, "quiz", skill.id);
    if (!scene.alive()) return;
    if (ok) score++;
    dots.children[i]?.classList.replace("now", ok ? "ok" : "miss");
    await wait(400);
  }
  if (!scene.alive()) return;
  noteQuiz(skill.id, score);
  const stars = starsFor(score);
  const card = h(
    "div",
    { class: "quiz-result pop-in" },
    h("div", { class: "quiz-stars" }, ...[0, 1, 2].map((i) => h("span", { class: i < stars ? "on" : "" }, icon("⭐")))),
    h("div", { class: "quiz-score" }, `${score} / ${QUIZ_LENGTH}`),
    h(
      "div",
      { class: "again-row" },
      h("button", { class: "go-btn", onclick: again, "aria-label": "Try the quiz again" }, icon("🔄"), " Again"),
      h("a", { class: "round-btn", href: "#/", "aria-label": "Home" }, icon("🏠")),
    ),
  );
  scene.root.replaceChildren(card);
  if (stars > 0) {
    sfx.fanfare();
    confetti(60 + stars * 30);
    for (let i = 0; i < stars; i++) await reward(card.querySelector(".quiz-stars"));
  }
  await speak(`${quizScore(score)} ${stars >= 2 ? LEARN_SAY.greatWork : LEARN_SAY.keepPracticing}`);
}

export async function runLesson(scene: Scene, lesson: Lesson, skills: Map<string, Skill>) {
  const host = h("div", { class: "lesson-host" });
  const replay = h("button", { class: "round-btn lesson-replay", "aria-label": "Say it again" }, icon("🔊"));
  const bar = h("div", { class: "lesson-bar", "aria-hidden": "true" });
  scene.root.replaceChildren(h("div", { class: "lesson-wrap" }, bar, host, replay));
  const steps = lesson.steps();
  bar.append(...steps.map(() => h("i")));
  await speak(LEARN_SAY.lessonStart);

  for (let i = 0; i < steps.length && scene.alive(); i++) {
    bar.children[i]?.classList.add("now");
    const step = steps[i];
    if ("say" in step) {
      replay.classList.remove("hidden");
      host.replaceChildren(h("div", { class: "lesson-card pop-in" }, step.show ? step.show() : ""));
      replay.onclick = () => speak(step.say);
      await speak(step.say);
      await wait(700);
    } else {
      replay.classList.add("hidden");
      const skill = skills.get(step.practice);
      const make = step.make ?? (() => skill!.make());
      await speak(LEARN_SAY.yourTurn);
      let last: Question | undefined;
      for (let k = 0; k < step.count && scene.alive(); k++) {
        const q = fresh(make, last);
        last = q;
        await ask(scene, host, q, "practice", step.practice);
        await wait(400);
      }
    }
    bar.children[i]?.classList.replace("now", "ok");
  }
  if (!scene.alive()) return;
  host.replaceChildren(h("div", { class: "lesson-card pop-in" }, h("div", { class: "lesson-done" }, icon("🎉"))));
  sfx.fanfare();
  confetti(120);
  await reward(host);
  await speak(LEARN_SAY.lessonDone);
}
