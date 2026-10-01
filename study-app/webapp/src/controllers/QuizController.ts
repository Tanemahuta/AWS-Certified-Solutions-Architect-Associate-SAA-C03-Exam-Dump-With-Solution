import type { Choice } from "../model/Choice";
import type { Problem } from "../model/Problem";
import type { ExamSession } from "../model/session/ExamSession";
import { AnswerStatistics } from "../persistence/AnswerStatistics";
import type { SessionStore } from "../persistence/session/SessionStore";
import type { QuestionSelector } from "../services/QuestionSelector";

type Listener = () => void;

/**
 * Abstract controller in the MVC sense: mediates between the persisted {@link ExamSession} model
 * and the view. Owns session lifecycle (start/restart/pause via the injected {@link SessionStore}),
 * all answer/navigation interaction, and every computed/display value the view needs - the model
 * itself holds no derived state.
 */
export abstract class QuizController<TSession extends ExamSession> {
  private readonly listeners = new Set<Listener>();
  private version = 0;

  protected session!: TSession;
  protected choices: Choice[] = [];
  protected selected: Choice[] = [];

  protected constructor(
    protected readonly problems: readonly Problem[],
    protected readonly store: SessionStore,
    protected readonly statistics: AnswerStatistics,
    protected readonly selector: QuestionSelector,
  ) {}

  protected abstract readonly storageKey: string;
  protected abstract get questionAmount(): number;
  protected abstract createSession(selectedQuestions: readonly number[]): TSession;
  protected abstract loadSession(): TSession | undefined;
  protected abstract persistSession(): void;
  protected abstract get complete(): boolean;

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.version += 1;
    this.listeners.forEach((listener) => listener());
  }

  /**
   * Monotonic version bumped on every state change, so views using useSyncExternalStore re-render
   * on any change (selection, submission, navigation) rather than only when questionNumber changes.
   */
  public get stateVersion(): number {
    return this.version;
  }

  public start(): void {
    this.session = this.loadSession() ?? this.createSession(this.selector.select(this.problems, this.questionAmount));
    this.loadQuestion();
    this.notify();
  }

  public restart(): void {
    this.store.clear(this.storageKey);
    this.session = this.createSession(this.selector.select(this.problems, this.questionAmount));
    this.persistSession();
    this.loadQuestion();
    this.notify();
  }

  public pause(): void {
    this.persistSession();
  }

  public clearStatistics(): void {
    this.statistics.clear();
  }

  /**
   * Selects or unselects a choice without recording it yet. Selection is pending until
   * {@link submit} records it; an already-submitted question can no longer be changed.
   */
  public answer(choice?: Choice): void {
    if (!choice || this.hasSubmitted) return;
    const alreadySelected = this.selected.some((item) => item.solution === choice.solution);
    if (alreadySelected) {
      this.selected = this.selected.filter((item) => item.solution !== choice.solution);
    } else if (this.isMultiple) {
      if (this.selected.length >= this.requiredSelections) return;
      this.selected = [...this.selected, choice];
    } else {
      this.selected = [choice];
    }
    this.notify();
  }

  /**
   * Records the pending selection as the answer for the current question and reveals the result.
   * No-op when the required amount of selections has not been made or the question is already submitted.
   */
  public submit(): void {
    if (!this.canSubmit) return;
    const correct = this.selected.length === this.correctChoices.length && this.selected.every((choice) => choice.correct);
    this.recordCurrentAnswer(this.selected.map((choice) => choice.solution), correct);
    this.persistSession();
    this.notify();
  }

  public markUnanswered(): void {
    if (this.selected.length > 0 || this.hasAnswered(this.questionIndex)) return;
    this.recordCurrentAnswer([], false);
  }

  public next(): void {
    // A pending selection must be submitted first; next() never silently drops it.
    if (!this.hasSubmitted && this.selected.length > 0) {
      this.notify();
      return;
    }
    if (!this.hasSubmitted) this.markUnanswered();
    if (this.isComplete) {
      this.completeSession();
      return;
    }
    this.session.index = this.nextIndex();
    this.loadQuestion();
    this.persistSession();
    this.notify();
  }

  protected completeSession(): void {
    this.persistSession();
    this.notify();
  }

  public previous(): void {
    if (!this.canGoPrevious()) return;
    this.session.index -= 1;
    this.loadQuestion();
    this.persistSession();
    this.notify();
  }

  protected abstract recordCurrentAnswer(solutions: readonly string[], correct: boolean): void;

  protected nextIndex(): number {
    return Math.min(this.session.index + 1, this.session.selectedQuestions.length - 1);
  }

  protected canGoPrevious(): boolean {
    return this.session.index > 0;
  }

  protected firstUnansweredIndex(): number {
    const index = this.session.selectedQuestions.findIndex((question) => !this.session.answers.has(question));
    return index >= 0 ? index : Math.max(this.session.selectedQuestions.length - 1, 0);
  }

  protected hasAnswered(question: number): boolean {
    return this.session.answers.has(question);
  }

  protected loadQuestion(): void {
    const question = this.problems[this.questionIndex];
    const savedOrder = this.session.choiceOrder.get(this.questionIndex);
    this.choices = savedOrder
      ? savedOrder.map((solution) => question.choices.find((choice) => choice.solution === solution)).filter((choice): choice is Choice => choice !== undefined)
      : this.shuffle(question.choices);
    this.session.setChoiceOrder(this.questionIndex, this.choices.map((choice) => choice.solution));
    this.selected = this.choices.filter((choice) => (this.session.answers.get(this.questionIndex) ?? []).includes(choice.solution));
  }

  protected shuffle<T>(items: readonly T[]): T[] {
    return [...items].sort(() => Math.random() - 0.5);
  }

  protected isCorrect(question: number, solutions: readonly string[]): boolean {
    const problem = this.problems[question];
    const correct = problem.choices.filter((choice) => choice.correct);
    return correct.length > 0 && solutions.length === correct.length && correct.every((choice) => solutions.includes(choice.solution));
  }

  protected get questionIndex(): number {
    return this.session.currentQuestion;
  }

  protected get isMultiple(): boolean {
    return this.correctChoices.length > 1;
  }

  protected get correctChoices(): readonly Choice[] {
    return this.problems[this.questionIndex]?.choices.filter((choice) => choice.correct) ?? [];
  }

  public get currentQuestion(): Problem {
    const question = this.problems[this.questionIndex];
    if (!question) throw new Error("No question is available.");
    return question;
  }

  public get currentChoices(): readonly Choice[] {
    return this.choices;
  }

  public get selectedChoice(): Choice | undefined {
    return this.selected[0];
  }

  public get selectedChoices(): readonly Choice[] {
    return this.selected;
  }

  /** How many choices must be selected before the answer can be submitted (number of correct choices). */
  public get requiredSelections(): number {
    return Math.max(this.correctChoices.length, 1);
  }

  /** Whether enough selections have been made and the question has not been submitted yet. */
  public get canSubmit(): boolean {
    return !this.hasSubmitted && this.selected.length >= this.requiredSelections;
  }

  /** Whether the answer for the current question has been submitted (recorded) already. */
  public get hasSubmitted(): boolean {
    return this.hasAnswered(this.questionIndex);
  }

  /** Whether the submitted selection for the current question was correct; undefined while pending. */
  public get currentAnswerCorrect(): boolean | undefined {
    if (!this.hasSubmitted) return undefined;
    const solutions = this.session.answers.get(this.questionIndex) ?? [];
    return this.isCorrect(this.questionIndex, solutions);
  }

  public get multiple(): boolean {
    return this.isMultiple;
  }

  public get questionNumber(): number {
    return this.session.index + 1;
  }

  public get totalQuestions(): number {
    return this.session.selectedQuestions.length;
  }

  public get answeredCount(): number {
    return this.session.answers.size;
  }

  public get incorrectCount(): number {
    return [...this.session.answers.entries()].filter(([question, solutions]) => !this.isCorrect(question, solutions)).length;
  }

  public get successRate(): number {
    const correct = this.session.answers.size - this.incorrectCount;
    return this.session.answers.size === 0 ? 0 : correct / this.session.answers.size;
  }

  public get isComplete(): boolean {
    return this.complete;
  }

  public get progress(): AnswerStatistics {
    return this.statistics;
  }
}
