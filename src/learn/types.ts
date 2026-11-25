/**
 * The learning framework: grades, skills (practice + quizzes), lessons and tools.
 *
 * Everything a skill, lesson or tool says must be listed by its `lines()` so
 * the natural voice can be pre-recorded (see src/voice/all-lines.ts).
 */
import type { Scene } from "../games/types";

export type Grade = "prek" | "k" | "g1";

export const GRADES: { id: Grade; label: string; short: string; color: string; say: string }[] = [
  { id: "prek", label: "Pre-K", short: "Pre-K", color: "#ff7043", say: "Pre-K!" },
  { id: "k", label: "Kindergarten", short: "K", color: "#7e57c2", say: "Kindergarten!" },
  { id: "g1", label: "1st Grade", short: "1st", color: "#26a69a", say: "First grade!" },
];

export type Area = "math" | "reading" | "world";

/** One answer button. */
export interface Choice {
  /** Draws the button's content (a picture, a number, a word...). */
  view: () => HTMLElement | string;
  /** Read out when the child picks it and it's wrong, e.g. "That's a square." */
  say?: string;
  correct?: boolean;
  /** Accessible label. */
  label: string;
}

export interface Question {
  /** Spoken (and repeated by the 🔊 button). */
  prompt: string;
  /** Optional picture/equation/clock shown above the choices. */
  show?: () => HTMLElement;
  choices: Choice[];
  /** Spoken after a right answer (after "Yes!"). Can include [[snd:id]]. */
  praise?: string;
  /** Spoken after a wrong answer, before trying again. Defaults to the prompt. */
  hint?: string;
  /** "big" = huge buttons for numbers/letters/words. */
  style?: "pics" | "big" | "words";
}

export interface Skill {
  id: string;
  grade: Grade;
  area: Area;
  title: string;
  /** Emoji glyph shown on the tile (Fluent picture when we have one). */
  icon: string;
  /** Spoken when the skill starts. */
  intro: string;
  make(): Question;
  /** Every sentence this skill can say (prompts, praise, hints, choice `say`s). */
  lines(): string[];
}

export type LessonStep =
  /** Show something and say something. */
  | { say: string; show?: () => HTMLElement }
  /** Then a few practice questions from a skill (optionally a custom question maker). */
  | { practice: string; count: number; make?: () => Question };

export interface Lesson {
  id: string;
  grade: Grade;
  area: Area;
  title: string;
  icon: string;
  steps: () => LessonStep[];
  lines(): string[];
}

export interface Tool {
  id: string;
  grades: Grade[];
  title: string;
  icon: string;
  start(scene: Scene): void | (() => void);
  lines(): string[];
}

/** Sentences that need a hand-written pronunciation (Kokoro phonemes), e.g. letter sounds. */
export type SpeakAs = Record<string, string>;
