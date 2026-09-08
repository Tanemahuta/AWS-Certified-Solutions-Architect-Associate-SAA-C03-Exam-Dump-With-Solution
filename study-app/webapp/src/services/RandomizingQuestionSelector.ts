import type { Problem } from "../model/Problem";
import type { QuestionSelector } from "./QuestionSelector";

/**
 * Decorates any {@link QuestionSelector}, shuffling the questions it selects. Keeps randomization
 * concerns out of the selection strategies themselves.
 */
export class RandomizingQuestionSelector implements QuestionSelector {
  public constructor(private readonly inner: QuestionSelector) {}

  public select(problems: readonly Problem[], amount: number): number[] {
    return this.inner.select(problems, amount).sort(() => Math.random() - 0.5);
  }
}
