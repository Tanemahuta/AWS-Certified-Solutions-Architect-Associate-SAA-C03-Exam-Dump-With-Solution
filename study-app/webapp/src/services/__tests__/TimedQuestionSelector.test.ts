import { mockProblems } from "../../test-support/mockProblem";
import { TimedQuestionSelector } from "../TimedQuestionSelector";
import * as domainSelectorModule from "../DomainQuestionSelector";

describe("TimedQuestionSelector", () => {
  it("delegates to a DomainQuestionSelector constructed with the requested amount and statistics", () => {
    const problems = mockProblems(5);
    const domains = ["A", "B", "C", "D", "E"];
    const select = jest.fn().mockReturnValue([1, 2, 3]);
    const constructorSpy = jest
      .spyOn(domainSelectorModule, "DomainQuestionSelector")
      .mockImplementation(() => ({ select }) as unknown as domainSelectorModule.DomainQuestionSelector);

    const statistics = { failureRate: jest.fn() } as unknown as import("../../persistence/AnswerStatistics").AnswerStatistics;
    const result = new TimedQuestionSelector(domains, statistics).select(problems, 3);

    expect(constructorSpy).toHaveBeenCalledWith(3, statistics);
    expect(select).toHaveBeenCalledWith(problems, domains);
    expect(result).toEqual([1, 2, 3]);

    constructorSpy.mockRestore();
  });
});
