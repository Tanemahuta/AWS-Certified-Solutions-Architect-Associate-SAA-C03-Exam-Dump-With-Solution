import type { Problem } from "../model/Problem";

/**
 * Builds a mock {@link Problem} for tests, with sensible defaults so tests only need to specify
 * what they care about.
 */
export function mockProblem(overrides: Partial<Problem> = {}): Problem {
  return {
    questionNumber: 1,
    question: "Mock question?",
    choices: [{ solution: "A", correct: true }, { solution: "B" }],
    ...overrides,
  };
}

/**
 * Builds `count` mock problems, numbered sequentially starting at 1.
 */
export function mockProblems(count: number): Problem[] {
  return Array.from({ length: count }, (_value, index) => mockProblem({ questionNumber: index + 1 }));
}
