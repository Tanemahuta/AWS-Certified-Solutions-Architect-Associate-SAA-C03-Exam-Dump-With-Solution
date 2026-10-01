import Levenshtein from "levenshtein";
import type { Choice } from "../model.js";
import { comparable } from "./Text.js";

export class AnswerMatcher {
  public match(choices: readonly Choice[], answer: string, answerLetters: readonly string[] = []): number[] {
    const letterIndexes = answerLetters
      .map((letter) => letter.charCodeAt(0) - "A".charCodeAt(0))
      .filter((index) => index >= 0 && index < choices.length);
    if (letterIndexes.length > 0) return letterIndexes;

    const normalizedAnswer = comparable(answer);
    const directIndex = choices.findIndex((choice) => {
      const choiceText = comparable(choice.solution);
      return choiceText && (normalizedAnswer.includes(choiceText) || choiceText.includes(normalizedAnswer));
    });
    if (directIndex >= 0) return [directIndex];

    const bestIndex = choices.reduce((best, choice, index) => {
      const bestSimilarity = best < 0 ? -1 : this.similarity(answer, choices[best].solution);
      return this.similarity(answer, choice.solution) > bestSimilarity ? index : best;
    }, -1);
    return bestIndex < 0 ? [] : [bestIndex];
  }

  private similarity(left: string, right: string): number {
    if (!left || !right) return 0;
    const maxLength = Math.max(left.length, right.length);
    return maxLength === 0 ? 1 : 1 - new Levenshtein(left.toLowerCase(), right.toLowerCase()).distance / maxLength;
  }
}
