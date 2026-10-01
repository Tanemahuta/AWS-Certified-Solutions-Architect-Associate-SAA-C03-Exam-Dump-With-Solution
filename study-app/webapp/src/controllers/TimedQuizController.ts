import type { Problem } from "../model/Problem";
import { TimedExamSession } from "../model/session/TimedExamSession";
import type { AnswerStatistics } from "../persistence/AnswerStatistics";
import type { SessionStore } from "../persistence/session/SessionStore";
import type { TimedSessionData } from "../persistence/session/TimedSessionData";
import { ScoringModel } from "../services/ScoringModel";
import type { QuestionSelector } from "../services/QuestionSelector";
import { TIMED_EXAM_QUESTION_AMOUNT, TIMED_EXAM_TIME_LIMIT_SECONDS, TIMED_EXAM_UNSCORED_QUESTION_COUNT } from "../config/examConfig";
import { QuizController } from "./QuizController";

const TIMED_SESSION_KEY = "saa-exam-timed-session";

/**
 * Controls a timed, scored exam session: 65 domain-balanced questions, a countdown timer, and a
 * final scaled score. The first {@link TIMED_EXAM_UNSCORED_QUESTION_COUNT} questions (in session order) do
 * not count towards the score, mirroring the real exam's unscored pretest questions.
 */
export class TimedQuizController extends QuizController<TimedExamSession> {
  private readonly correctAnswers = new Set<number>();
  private readonly scoring = new ScoringModel();
  private unansweredFinal = false;

  public constructor(problems: readonly Problem[], store: SessionStore, statistics: AnswerStatistics, selector: QuestionSelector) {
    super(problems, store, statistics, selector);
  }

  protected readonly storageKey = TIMED_SESSION_KEY;
  protected get questionAmount(): number {
    return TIMED_EXAM_QUESTION_AMOUNT;
  }

  protected createSession(selectedQuestions: readonly number[]): TimedExamSession {
    this.correctAnswers.clear();
    this.unansweredFinal = false;
    return TimedExamSession.create(selectedQuestions, TIMED_EXAM_TIME_LIMIT_SECONDS);
  }

  protected loadSession(): TimedExamSession | undefined {
    const data = this.store.load<TimedSessionData>(this.storageKey);
    if (!data) return undefined;
    const session = TimedExamSession.fromData(data);
    this.correctAnswers.clear();
    this.unansweredFinal = session.index >= session.selectedQuestions.length - 1 && (session.answers.get(session.selectedQuestions[session.index]) ?? []).length === 0;
    session.answers.forEach((solutions, question) => {
      if (!this.unscoredQuestions(session).has(question) && this.isCorrect(question, solutions)) this.correctAnswers.add(question);
    });
    session.index = this.firstUnansweredIndexFor(session);
    return session;
  }

  protected persistSession(): void {
    this.store.store<TimedSessionData>(this.storageKey, this.session.data);
  }

  public setRemainingSeconds(seconds: number): void {
    this.session.remainingSeconds = seconds;
    this.persistSession();
  }

  public get remainingSeconds(): number {
    return this.session.remainingSeconds;
  }

  protected recordCurrentAnswer(solutions: readonly string[], correct: boolean): void {
    this.session.recordAnswer(this.questionIndex, solutions);
    if (!this.unscoredQuestions(this.session).has(this.questionIndex) && correct) this.correctAnswers.add(this.questionIndex);
    this.statistics.record(this.questionIndex, correct);
    if (this.session.index >= this.session.selectedQuestions.length - 1 && solutions.length === 0) this.unansweredFinal = true;
  }

  protected firstUnansweredIndexFor(session: TimedExamSession): number {
    const index = session.selectedQuestions.findIndex((question) => !session.answers.has(question));
    return index >= 0 ? index : Math.max(session.selectedQuestions.length - 1, 0);
  }

  public get score(): number {
    return this.correctAnswers.size;
  }

  public get scoredQuestionCount(): number {
    return this.session.selectedQuestions.filter((question) => !this.unscoredQuestions(this.session).has(question)).length;
  }

  public get scaledScore(): number {
    const correctScored = this.session.selectedQuestions.filter((question) => this.correctAnswers.has(question) && !this.unscoredQuestions(this.session).has(question)).length;
    return this.scoring.scaledScore(correctScored, this.scoredQuestionCount);
  }

  public get unscoredQuestionCount(): number {
    return this.unscoredQuestions(this.session).size;
  }

  public get wrongQuestions(): number[] {
    return [...this.session.answers.entries()]
      .filter(([question, solutions]) => !this.isCorrect(question, solutions))
      .map(([question]) => question);
  }

  protected get complete(): boolean {
    return this.session.index >= this.session.selectedQuestions.length - 1 && (this.selectedChoices.length > 0 || this.unansweredFinal);
  }

  /**
   * Questions in the session that are not scored towards the final result. Derived deterministically
   * from the (already shuffled) session question order, so it does not need to be persisted separately.
   */
  private unscoredQuestions(session: TimedExamSession): Set<number> {
    return new Set(session.selectedQuestions.slice(0, TIMED_EXAM_UNSCORED_QUESTION_COUNT));
  }
}
