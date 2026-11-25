/** Open-ended learning tools (tracing, counters, number chart, clock, flashcards). */
import type { Tool } from "../types";
import { clock } from "./clock";
import { counters } from "./counters";
import { flashcards } from "./flashcards";
import { numbers } from "./numbers";
import { trace } from "./trace";
import "./tools.css";

export const TOOLS: Tool[] = [trace, counters, numbers, clock, flashcards];
