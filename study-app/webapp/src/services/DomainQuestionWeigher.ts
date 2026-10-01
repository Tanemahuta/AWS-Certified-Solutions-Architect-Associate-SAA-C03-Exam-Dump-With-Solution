import type { Problem } from "../model/Problem";
import type { AnswerStatistics } from "../persistence/AnswerStatistics";
import { AnswerPriority } from "../persistence/AnswerStatistics";
import type { WeightedQuestion } from "./WeightedQuestion";

/**
 * First pipeline stage: tags every question with its domain and a within-domain selection
 * weight, derived from {@link AnswerStatistics.priority} (never-correct and recently-failed
 * questions outrank stale failures and already-mastered questions) with the failure rate as a
 * tiebreaker.
 */
export class DomainQuestionWeigher {
  public constructor(private readonly statistics?: AnswerStatistics) {}

  public weigh(problems: readonly Problem[], domains: readonly string[]): WeightedQuestion[] {
    return problems.map((_problem, index) => ({
      index,
      domain: domains[index],
      weight: this.weight(index),
    }));
  }

  private weight(index: number): number {
    const priority = this.statistics?.priority(index) ?? AnswerPriority.NeverCorrect;
    const failureRate = this.statistics?.failureRate(index) ?? 0;
    return priority + failureRate;
  }
}
