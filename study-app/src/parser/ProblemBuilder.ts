import type { Choice, Problem } from "../model.js";
import type { Solution } from "./Solution.js";
import { AnswerMatcher } from "./AnswerMatcher.js";
import { normalize } from "./Text.js";

export class ProblemBuilder {
  public constructor(private readonly matcher = new AnswerMatcher()) {}

  public build(questionNumber: number, question: string, choices: readonly Choice[], solution?: Solution): Problem {
    const expectedAnswers = this.expectedAnswerCount(question);
    const matchedIndexes = solution ? this.matcher.match(choices, solution.answer, solution.answerLetters) : [];
    const answerIndexes = expectedAnswers === undefined ? matchedIndexes : matchedIndexes.slice(0, expectedAnswers);
    if (expectedAnswers !== undefined && answerIndexes.length !== expectedAnswers) {
      console.warn(`Question ${questionNumber} expects ${expectedAnswers} answers, but parser found ${answerIndexes.length}.`);
    }
    return {
      questionNumber,
      question: normalize(question.replace(new RegExp(`^${questionNumber}\\s+`), "")),
      choices: choices.map((choice, index) => ({
        ...choice,
        ...(answerIndexes.includes(index) ? { correct: true as const } : {}),
        ...(answerIndexes.includes(index) && solution?.explanation ? { explanation: solution.explanation } : {}),
      })),
    };
  }

  private expectedAnswerCount(question: string): number | undefined {
    const match = question.match(/\((?:choose|select)\s+(two|three|four|five)\.?\)/i) ?? question.match(/(?:choose|select)\s+(two|three|four|five)\b/i);
    if (!match) return undefined;
    return { two: 2, three: 3, four: 4, five: 5 }[match[1].toLowerCase() as "two" | "three" | "four" | "five"];
  }
}
