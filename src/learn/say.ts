/** Phrases shared by every practice, quiz and lesson. */
import { NUMBERS } from "../voice/lines";
import { QUIZ_LENGTH } from "./progress";
import { GRADES } from "./types";

export const LEARN_SAY = {
  practice: "Let's practice!",
  quizStart: "Quiz time! Ten questions. Do your best!",
  next: "Next one!",
  itWasThis: "It was this one.",
  okay: "Okay!",
  greatWork: "Great work!",
  keepPracticing: "Keep practicing, you're getting better!",
  lessonStart: "Lesson time!",
  yourTurn: "Your turn!",
  lessonDone: "All done! Great learning!",
  tryAgain: "Try again!",
  pickGrade: "Who's playing? Pick a grade!",
  play: "Play!",
  practiceSection: "Practice!",
  learnSection: "Learn!",
  toolsSection: "Tools!",
  quizSection: "Quiz!",
};

export const PRAISE = ["Yes!", "Great job!", "You got it!", "That's right!", "Awesome!", "Super!"];

export function quizScore(n: number) {
  return `You got ${NUMBERS[n] ?? n} out of ${NUMBERS[QUIZ_LENGTH] ?? QUIZ_LENGTH}!`;
}

export function learnLines(): string[] {
  const out = [...Object.values(LEARN_SAY), ...PRAISE, ...GRADES.map((g) => g.say)];
  for (let n = 0; n <= QUIZ_LENGTH; n++) out.push(quizScore(n));
  return out;
}
