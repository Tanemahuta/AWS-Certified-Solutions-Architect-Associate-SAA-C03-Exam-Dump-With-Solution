import { mockProblems } from "../../test-support/mockProblem";
import { InfiniteQuestionSelector } from "../InfiniteQuestionSelector";

describe("InfiniteQuestionSelector", () => {
  it("selects every question index in order, up to the requested amount", () => {
    const problems = mockProblems(5);
    expect(new InfiniteQuestionSelector().select(problems, 5)).toEqual([0, 1, 2, 3, 4]);
  });

  it("caps the selection at the requested amount when smaller than the pool", () => {
    const problems = mockProblems(5);
    expect(new InfiniteQuestionSelector().select(problems, 3)).toEqual([0, 1, 2]);
  });

  it("caps the selection at the pool size when amount exceeds it", () => {
    const problems = mockProblems(3);
    expect(new InfiniteQuestionSelector().select(problems, 10)).toEqual([0, 1, 2]);
  });
});
