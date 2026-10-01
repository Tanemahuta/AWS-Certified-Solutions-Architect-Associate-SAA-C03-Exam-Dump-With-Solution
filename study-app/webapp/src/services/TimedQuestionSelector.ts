import type { Problem } from "../model/Problem";
import type { AnswerStatistics } from "../persistence/AnswerStatistics";
import { DomainQuestionSelector } from "./DomainQuestionSelector";
import type { QuestionSelector } from "./QuestionSelector";

/**
 * Selects a domain-balanced, difficulty-weighted set of questions for a timed exam session.
 */
export class TimedQuestionSelector implements QuestionSelector {
  public constructor(
    private readonly domains: readonly string[],
    private readonly statistics?: AnswerStatistics,
  ) {}

  public select(problems: readonly Problem[], amount: number): number[] {
    return new DomainQuestionSelector(amount, this.statistics).select(problems, this.domains);
  }
}
