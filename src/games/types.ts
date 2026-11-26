export interface Scene {
  /** The element the game draws into. */
  root: HTMLElement;
  /** Aborted when the child leaves the game. */
  signal: AbortSignal;
  /** False once the game has been left; check after every await. */
  alive(): boolean;
}

export interface Game {
  id: string;
  title: string;
  icon: string;
  color: string;
  start(scene: Scene): void | (() => void);
  /** Every sentence this game can say, for the recorded voice (see src/voice/all-lines.ts). */
  lines?(): string[];
}
