import type { WeightedQuestion } from "../WeightedQuestion";
import { QuotaQuestionPicker } from "../QuotaQuestionPicker";

describe("QuotaQuestionPicker", () => {
  it("picks the highest-weighted questions per domain up to its quota", () => {
    const questions: WeightedQuestion[] = [
      { index: 0, domain: "A", weight: 1 },
      { index: 1, domain: "A", weight: 3 },
      { index: 2, domain: "A", weight: 2 },
      { index: 3, domain: "B", weight: 5 },
      { index: 4, domain: "B", weight: 1 },
    ];
    const quotas = new Map([["A", 2], ["B", 1]]);
    expect(new QuotaQuestionPicker().pick(questions, quotas)).toMatchSnapshot();
  });

  it("returns nothing for a domain with a zero quota", () => {
    const questions: WeightedQuestion[] = [{ index: 0, domain: "A", weight: 1 }];
    const quotas = new Map([["A", 0]]);
    expect(new QuotaQuestionPicker().pick(questions, quotas)).toEqual([]);
  });
});
