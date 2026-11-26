/** The games in the Play section, in order. */
import { abc } from "./abc";
import { colors } from "./colors";
import { count } from "./count";
import { draw } from "./draw";
import { dig } from "./dig";
import { find } from "./find";
import { music } from "./music";
import { race } from "./race";
import { sounds } from "./sounds";
import { talk } from "./talk";
import type { Game } from "./types";

export const GAMES: Game[] = [sounds, draw, music, talk, find, count, colors, dig, race, abc];
