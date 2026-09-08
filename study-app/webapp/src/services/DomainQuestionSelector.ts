import type { Problem } from "../model/Problem";
import type { AnswerStatistics } from "../persistence/AnswerStatistics";
import { DomainQuestionWeigher } from "./DomainQuestionWeigher";
import { DomainQuotaCalculator } from "./DomainQuotaCalculator";
import { QuotaQuestionPicker } from "./QuotaQuestionPicker";

/**
 * Selects a domain-balanced, difficulty-weighted set of questions by piping problems through
 * three stages: {@link DomainQuestionWeigher} tags each question with a domain and weight,
 * {@link DomainQuotaCalculator} decides how many questions to draw per domain, and
 * {@link QuotaQuestionPicker} picks the highest-weighted questions per domain up to quota.
 */
export class DomainQuestionSelector {
  public constructor(
    private readonly questionLimit = 65,
    private readonly statistics?: AnswerStatistics,
    private readonly weigher: DomainQuestionWeigher = new DomainQuestionWeigher(statistics),
    private readonly quotaCalculator: DomainQuotaCalculator = new DomainQuotaCalculator(),
    private readonly picker: QuotaQuestionPicker = new QuotaQuestionPicker(),
  ) {}

  public select(problems: readonly Problem[], domains: readonly string[]): number[] {
    const weighted = this.weigher.weigh(problems, domains);
    const quotas = this.quotaCalculator.quotasFor(weighted, Math.min(this.questionLimit, problems.length));
    return this.picker.pick(weighted, quotas);
  }
}
