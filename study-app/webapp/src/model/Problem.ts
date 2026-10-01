import type { Choice } from "./Choice";

export interface Problem {
  readonly questionNumber: number;
  readonly question: string;
  readonly choices: readonly Choice[];
}
