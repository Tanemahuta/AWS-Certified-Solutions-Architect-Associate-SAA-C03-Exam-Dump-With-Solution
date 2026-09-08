import type { Problem } from "../model/Problem";
import { InfiniteExamSession } from "../model/session/InfiniteExamSession";
import type { AnswerStatistics } from "../persistence/AnswerStatistics";
import type { SessionStore } from "../persistence/session/SessionStore";
import type { InfiniteSessionData } from "../persistence/session/InfiniteSessionData";
import type { QuestionSelector } from "../services/QuestionSelector";
import { QuizController } from "./QuizController";

const INFINITE_SESSION_KEY = "saa-exam-infinite-session";

/**
 * Controls an untimed practice session covering every question. Failed questions are retained for
 * reporting and future weighted selection, but the current run continues through unanswered items
 * instead of jumping back to failures immediately.
 */
export class InfiniteQuizController extends QuizController<InfiniteExamSession> {
  public constructor(problems: readonly Problem[], store: SessionStore, statistics: AnswerStatistics, selector: QuestionSelector) {
    super(problems, store, statistics, selector);
  }

  protected readonly storageKey = INFINITE_SESSION_KEY;
  protected get questionAmount(): number {
    return this.problems.length;
  }

  protected createSession(selectedQuestions: readonly number[]): InfiniteExamSession {
    return InfiniteExamSession.create(selectedQuestions);
  }

  protected loadSession(): InfiniteExamSession | undefined {
    const data = this.store.load<InfiniteSessionData>(this.storageKey);
    if (!data) return undefined;
    const session = InfiniteExamSession.fromData(data);
    session.index = this.firstUnansweredIndexFor(session);
    return session;
  }

  protected persistSession(): void {
    this.store.store<InfiniteSessionData>(this.storageKey, this.session.data);
  }

  protected recordCurrentAnswer(solutions: readonly string[], correct: boolean): void {
    this.session.recordAnswer(this.questionIndex, solutions);
    this.statistics.record(this.questionIndex, correct);
    if (correct) {
      this.session.completed.add(this.questionIndex);
      this.session.failed.delete(this.questionIndex);
    } else {
      this.session.failed.add(this.questionIndex);
    }
  }

  protected nextIndex(): number {
    const next = this.session.selectedQuestions.findIndex((question) => !this.session.answers.has(question));
    return next >= 0 ? next : this.session.index;
  }

  protected override completeSession(): void {
    if (this.session.failed.size === 0) {
      super.completeSession();
      return;
    }
    this.session.retryFailedQuestions();
    this.loadQuestion();
    super.completeSession();
  }

  private firstUnansweredIndexFor(session: InfiniteExamSession): number {
    const index = session.selectedQuestions.findIndex((question) => !session.answers.has(question));
    return index >= 0 ? index : Math.max(session.selectedQuestions.length - 1, 0);
  }

  public get wrongQuestions(): number[] {
    return [...this.session.failed];
  }

  public get remainingQuestions(): number {
    return this.session.selectedQuestions.filter((question) => !this.session.answers.has(question)).length;
  }

  protected get complete(): boolean {
    return this.session.selectedQuestions.every((question) => this.session.answers.has(question));
  }
}
