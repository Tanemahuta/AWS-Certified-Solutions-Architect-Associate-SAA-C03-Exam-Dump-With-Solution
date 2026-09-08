import type { Choice } from "../model/Choice";

export class ScoringModel {
  public readonly passingScore = 720;
  public readonly maximumScore = 1000;

  public isCorrect(selected: readonly Choice[], choices: readonly Choice[]): boolean {
    const correct = choices.filter((choice) => choice.correct);
    return correct.length > 0
      && selected.length === correct.length
      && selected.every((choice) => choice.correct);
  }

  public percentage(correctAnswers: number, totalQuestions: number): number {
    return totalQuestions === 0 ? 0 : correctAnswers / totalQuestions * 100;
  }

  public passed(correctAnswers: number, totalQuestions: number): boolean {
    return this.scaledScore(correctAnswers, totalQuestions) >= this.passingScore;
  }

  public scaledScore(correctAnswers: number, totalQuestions: number): number {
    return Math.round(this.percentage(correctAnswers, totalQuestions) / 100 * this.maximumScore);
  }
}
