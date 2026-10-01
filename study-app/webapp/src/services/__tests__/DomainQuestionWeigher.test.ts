import { installMockLocalStorage } from "../../test-support/mockLocalStorage";
import { mockProblems } from "../../test-support/mockProblem";
import { AnswerStatistics } from "../../persistence/AnswerStatistics";
import { SessionStore } from "../../persistence/session/SessionStore";
import { DomainQuestionWeigher } from "../DomainQuestionWeigher";

describe("DomainQuestionWeigher", () => {
  beforeEach(() => installMockLocalStorage());

  it("tags every question with its domain and a neutral weight when there are no statistics", () => {
    const problems = mockProblems(3);
    const domains = ["Design Secure Architectures", "Design Resilient Architectures", "Design Secure Architectures"];
    expect(new DomainQuestionWeigher().weigh(problems, domains)).toMatchSnapshot();
  });

  it("weighs recently-failed questions higher than mastered ones", () => {
    const problems = mockProblems(2);
    const domains = ["Design Secure Architectures", "Design Secure Architectures"];
    const stats = new AnswerStatistics(new SessionStore("hash"));
    stats.record(0, true); // question 0: mastered
    stats.record(1, true);
    stats.record(1, false); // question 1: recently failed

    const weighed = new DomainQuestionWeigher(stats).weigh(problems, domains);
    const weightOf = (index: number): number => weighed.find((question) => question.index === index)?.weight ?? -1;
    expect(weightOf(1)).toBeGreaterThan(weightOf(0));
  });
});
