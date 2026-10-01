import type { ExamSessionData } from "../../persistence/session/ExamSessionData";

/**
 * Plain state for an exam session: the questions selected, the answers recorded so far, the
 * order choices are displayed in, and which question is currently active.
 *
 * This class holds no derived/computed values and no persistence logic - it is the model that
 * view models build computed statistics and behavior on top of.
 */
export abstract class ExamSession {
  public readonly answers = new Map<number, string[]>();
  public readonly choiceOrder = new Map<number, string[]>();
  public selectedQuestions: number[];

  protected constructor(
    selectedQuestions: readonly number[],
    public index: number = 0,
  ) {
    this.selectedQuestions = [...selectedQuestions];
  }

  public recordAnswer(question: number, solutions: readonly string[]): void {
    this.answers.set(question, [...solutions]);
  }

  public setChoiceOrder(question: number, order: readonly string[]): void {
    this.choiceOrder.set(question, [...order]);
  }

  public get currentQuestion(): number {
    return this.selectedQuestions[this.index] ?? 0;
  }

  protected get baseData(): Omit<ExamSessionData, "questionHash"> {
    return {
      selectedQuestions: [...this.selectedQuestions],
      index: this.index,
      answers: Object.fromEntries(this.answers),
      choiceOrder: Object.fromEntries(this.choiceOrder),
    };
  }

  protected static restoreBase(data: ExamSessionData, session: ExamSession): void {
    session.index = data.index;
    Object.entries(data.answers).forEach(([question, solutions]) => session.answers.set(Number(question), solutions));
    Object.entries(data.choiceOrder).forEach(([question, order]) => session.choiceOrder.set(Number(question), order));
  }
}
