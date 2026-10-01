import { mockProblems } from "../../test-support/mockProblem";
import type { WeightedQuestion } from "../WeightedQuestion";
import { DomainQuestionSelector } from "../DomainQuestionSelector";
import type { DomainQuestionWeigher } from "../DomainQuestionWeigher";
import type { DomainQuotaCalculator } from "../DomainQuotaCalculator";
import type { QuotaQuestionPicker } from "../QuotaQuestionPicker";

const DOMAINS = [
  "Design Secure Architectures",
  "Design Resilient Architectures",
  "Design High-Performing Architectures",
  "Design Cost-Optimized Architectures",
];

describe("DomainQuestionSelector", () => {
  it("selects a full session honoring the fixed AWS domain percentages", () => {
    const problems = mockProblems(200);
    const domains = problems.map((_problem, index) => DOMAINS[index % DOMAINS.length]);
    const selected = new DomainQuestionSelector(65).select(problems, domains);

    expect(selected).toHaveLength(65);
    expect(new Set(selected).size).toBe(65); // no duplicates

    const perDomain = new Map<string, number>();
    selected.forEach((index) => perDomain.set(domains[index], (perDomain.get(domains[index]) ?? 0) + 1));
    expect(Object.fromEntries(perDomain)).toMatchSnapshot();
  });

  it("never selects more questions than exist in the pool", () => {
    const problems = mockProblems(10);
    const domains = problems.map((_problem, index) => DOMAINS[index % DOMAINS.length]);
    const selected = new DomainQuestionSelector(65).select(problems, domains);
    expect(selected).toHaveLength(10);
  });

  it("wires the three pipeline stages together, passing each stage's output to the next", () => {
    const problems = mockProblems(3);
    const domains = ["A", "B", "C"];
    const weighted: WeightedQuestion[] = [{ index: 0, domain: "A", weight: 1 }];
    const quotas = new Map([["A", 1]]);

    const weigher: Pick<DomainQuestionWeigher, "weigh"> = { weigh: jest.fn().mockReturnValue(weighted) };
    const quotaCalculator: Pick<DomainQuotaCalculator, "quotasFor"> = { quotasFor: jest.fn().mockReturnValue(quotas) };
    const picker: Pick<QuotaQuestionPicker, "pick"> = { pick: jest.fn().mockReturnValue([0]) };

    const selector = new DomainQuestionSelector(
      2,
      undefined,
      weigher as DomainQuestionWeigher,
      quotaCalculator as DomainQuotaCalculator,
      picker as QuotaQuestionPicker,
    );
    const result = selector.select(problems, domains);

    expect(weigher.weigh).toHaveBeenCalledWith(problems, domains);
    expect(quotaCalculator.quotasFor).toHaveBeenCalledWith(weighted, 2);
    expect(picker.pick).toHaveBeenCalledWith(weighted, quotas);
    expect(result).toEqual([0]);
  });

  it("caps the requested amount passed to the quota calculator at the pool size", () => {
    const problems = mockProblems(3);
    const domains = ["A", "B", "C"];
    const quotaCalculator: Pick<DomainQuotaCalculator, "quotasFor"> = { quotasFor: jest.fn().mockReturnValue(new Map()) };

    new DomainQuestionSelector(65, undefined, undefined, quotaCalculator as DomainQuotaCalculator).select(problems, domains);

    expect(quotaCalculator.quotasFor).toHaveBeenCalledWith(expect.anything(), 3);
  });
});
