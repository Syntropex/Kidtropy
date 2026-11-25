/** Every skill, lesson and tool, by grade. */
import { MATH_LESSONS, MATH_SKILLS } from "./math";
import { READING_LESSONS, READING_SKILLS, READING_SPEAK_AS } from "./reading";
import { TOOLS } from "./tools/index";
import type { Grade, Lesson, Skill, SpeakAs, Tool } from "./types";

export const SKILLS: Skill[] = [...MATH_SKILLS, ...READING_SKILLS];
export const LESSONS: Lesson[] = [...MATH_LESSONS, ...READING_LESSONS];
export { TOOLS };
export const SPEAK_AS: SpeakAs = { ...READING_SPEAK_AS };

export const skillById = new Map(SKILLS.map((s) => [s.id, s]));
export const lessonById = new Map(LESSONS.map((l) => [l.id, l]));
export const toolById = new Map(TOOLS.map((t) => [t.id, t]));

export const skillsFor = (g: Grade): Skill[] => SKILLS.filter((s) => s.grade === g);
export const lessonsFor = (g: Grade): Lesson[] => LESSONS.filter((l) => l.grade === g);
export const toolsFor = (g: Grade): Tool[] => TOOLS.filter((t) => t.grades.includes(g));
