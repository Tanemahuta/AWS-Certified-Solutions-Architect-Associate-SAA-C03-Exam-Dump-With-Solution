import type { Problem } from "../model/Problem";

/**
 * Selects the questions (by index into the problem list) to include in an exam session.
 */
export interface QuestionSelector {
  select(problems: readonly Problem[], amount: number): number[];
}
