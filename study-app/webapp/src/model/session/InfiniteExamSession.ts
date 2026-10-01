import type { InfiniteSessionData } from "../../persistence/session/InfiniteSessionData";
import { ExamSession } from "./ExamSession";

/**
 * Plain state for an infinite practice session: the questions selected, answers, choice order,
 * and which questions have been completed or are currently marked as failed and awaiting retry.
 */
export class InfiniteExamSession extends ExamSession {
  public readonly completed = new Set<number>();
  public readonly failed = new Set<number>();

  private constructor(selectedQuestions: readonly number[], index = 0) {
    super(selectedQuestions, index);
  }

  public static create(selectedQuestions: readonly number[]): InfiniteExamSession {
    return new InfiniteExamSession(selectedQuestions);
  }

  public static fromData(data: InfiniteSessionData): InfiniteExamSession {
    const session = new InfiniteExamSession(data.selectedQuestions);
    ExamSession.restoreBase(data, session);
    data.completed.forEach((question) => session.completed.add(question));
    data.failed.forEach((question) => session.failed.add(question));
    return session;
  }

  /**
   * Starts another pass in the same session, containing only the questions that were answered
   * incorrectly. Correctly answered questions remain in the answer history; failed questions are
   * made unanswered again so they can be selected and submitted in the retry pass.
   */
  public retryFailedQuestions(): void {
    const failedQuestions = [...this.failed];
    this.selectedQuestions = failedQuestions;
    this.index = 0;
    failedQuestions.forEach((question) => this.answers.delete(question));
  }

  public get data(): Omit<InfiniteSessionData, "questionHash"> {
    return {
      ...this.baseData,
      completed: [...this.completed],
      failed: [...this.failed],
    };
  }
}
