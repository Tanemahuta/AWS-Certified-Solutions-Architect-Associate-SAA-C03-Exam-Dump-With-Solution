import type { Problem } from "../model";
import { QuestionOverrideApplier } from "./QuestionOverrideApplier";

describe("QuestionOverrideApplier", () => {
  const problem: Problem = {
    questionNumber: 15,
    question: "Original question",
    choices: [
      { solution: "Original A", correct: true, explanation: "Original explanation" },
      { solution: "Original B" },
    ],
  };

  it("deep merges an override while retaining unspecified problem fields", () => {
    const result = new QuestionOverrideApplier({
      "15": { question: "Corrected question" },
    }).apply(problem);

    expect(result).toEqual({
      ...problem,
      question: "Corrected question",
    });
  });

  it("deep merges array elements by index without concatenating", () => {
    const result = new QuestionOverrideApplier({
      "15": {
        choices: [
          { explanation: "Updated explanation" },
          { correct: true },
        ],
      },
    }).apply(problem);

    expect(result.choices).toEqual([
      { solution: "Original A", correct: true, explanation: "Updated explanation" },
      { solution: "Original B", correct: true },
    ]);
  });

  it("preserves an explicit false override", () => {
    const result = new QuestionOverrideApplier({
      "15": {
        choices: [
          { correct: false },
          { correct: true },
        ],
      },
    }).apply(problem);

    expect(result.choices[0]?.correct).toBe(false);
    expect(result.choices[1]?.correct).toBe(true);
  });
});
