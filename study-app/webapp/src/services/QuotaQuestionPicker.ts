import type { WeightedQuestion } from "./WeightedQuestion";

/**
 * Third pipeline stage: picks, per domain, the highest-weighted questions up to that domain's
 * quota, then flattens the result into a single list of question indices (unshuffled - see
 * {@link RandomizingQuestionSelector}).
 */
export class QuotaQuestionPicker {
  public pick(questions: readonly WeightedQuestion[], quotas: ReadonlyMap<string, number>): number[] {
    const byDomain = new Map<string, WeightedQuestion[]>();
    questions.forEach((question) => byDomain.set(question.domain, [...(byDomain.get(question.domain) ?? []), question]));

    return [...byDomain.entries()].flatMap(([domain, domainQuestions]) =>
      [...domainQuestions]
        .sort((left, right) => right.weight - left.weight)
        .slice(0, quotas.get(domain) ?? 0)
        .map((question) => question.index),
    );
  }
}
