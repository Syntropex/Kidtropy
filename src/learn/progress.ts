/** Practice counts and quiz scores per skill, stored on this device only. */
import type { Grade } from "./types";

export interface SkillRecord {
  practiced: number; // correct practice answers
  quizzes: number;
  best: number; // best quiz score out of QUIZ_LENGTH
  last: number; // last quiz score
  lastAt: number; // ms timestamp of last quiz
}

export const QUIZ_LENGTH = 10;

const KEY = "kidtropy.learn";

interface Store {
  grade: Grade;
  skills: Record<string, SkillRecord>;
}

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { grade: "prek", skills: {}, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { grade: "prek", skills: {} };
}

const store = load();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function grade(): Grade {
  return store.grade;
}

export function setGrade(g: Grade) {
  store.grade = g;
  save();
}

export function record(skill: string): SkillRecord {
  return (store.skills[skill] ??= { practiced: 0, quizzes: 0, best: 0, last: 0, lastAt: 0 });
}

export function notePractice(skill: string) {
  record(skill).practiced++;
  save();
}

export function noteQuiz(skill: string, score: number) {
  const r = record(skill);
  r.quizzes++;
  r.last = score;
  r.best = Math.max(r.best, score);
  r.lastAt = Date.now();
  save();
}

/** 0–3 stars for a quiz score. */
export function starsFor(score: number): number {
  if (score >= 9) return 3;
  if (score >= 7) return 2;
  if (score >= 4) return 1;
  return 0;
}

export function resetLearning() {
  store.skills = {};
  save();
}
