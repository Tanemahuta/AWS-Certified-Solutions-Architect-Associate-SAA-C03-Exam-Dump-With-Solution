import type { Problem } from "../model/Problem";
import type { QuestionSelector } from "./QuestionSelector";

/**
 * Selects questions for an infinite practice session, capped to `amount` (or the full pool if
 * smaller).
 */
export class InfiniteQuestionSelector implements QuestionSelector {
  public select(problems: readonly Problem[], amount: number): number[] {
    return [...problems.keys()].slice(0, Math.min(amount, problems.length));
  }
}
