import type { Problem } from "../../model/Problem";
import type { QuestionSelector } from "../QuestionSelector";
import { RandomizingQuestionSelector } from "../RandomizingQuestionSelector";

describe("RandomizingQuestionSelector", () => {
  it("delegates selection to the inner selector, forwarding problems and amount", () => {
    const inner: QuestionSelector = { select: jest.fn().mockReturnValue([0, 1, 2]) };
    const problems: Problem[] = [];
    new RandomizingQuestionSelector(inner).select(problems, 3);
    expect(inner.select).toHaveBeenCalledWith(problems, 3);
  });

  it("returns the same set of questions the inner selector picked, just reordered", () => {
    const inner: QuestionSelector = { select: () => [0, 1, 2, 3, 4] };
    const result = new RandomizingQuestionSelector(inner).select([], 5);
    expect(result.slice().sort((left, right) => left - right)).toEqual([0, 1, 2, 3, 4]);
  });
});
