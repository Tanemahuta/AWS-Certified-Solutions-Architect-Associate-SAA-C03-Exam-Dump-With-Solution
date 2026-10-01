import { mockProblems } from "../../test-support/mockProblem";
import { mockSessionStore } from "../../test-support/mockSessionStore";
import type { AnswerStatistics } from "../../persistence/AnswerStatistics";
import type { SessionStore } from "../../persistence/session/SessionStore";
import type { QuestionSelector } from "../../services/QuestionSelector";
import type { Choice } from "../../model/Choice";
import { InfiniteQuizController } from "../InfiniteQuizController";

function mockStatistics(): jest.Mocked<Pick<AnswerStatistics, "record" | "clear" | "get" | "failureRate" | "priority">> {
  return {
    record: jest.fn(),
    clear: jest.fn(),
    get: jest.fn(),
    failureRate: jest.fn().mockReturnValue(0),
    priority: jest.fn().mockReturnValue(3),
  };
}

function mockSelector(selected: number[]): jest.Mocked<QuestionSelector> {
  return { select: jest.fn().mockReturnValue(selected) };
}

describe("InfiniteQuizController", () => {
  it("starts a fresh session by asking the selector for every question", () => {
    const problems = mockProblems(4);
    const store = mockSessionStore();
    const statistics = mockStatistics();
    const selector = mockSelector([0, 1, 2, 3]);

    const controller = new InfiniteQuizController(problems, store as unknown as SessionStore, statistics as unknown as AnswerStatistics, selector);
    controller.start();

    expect(selector.select).toHaveBeenCalledWith(problems, 4);
    expect(controller.totalQuestions).toBe(4);
  });

  it("keeps failed questions for reporting without jumping back before unanswered questions", () => {
    const problems = mockProblems(3);
    const store = mockSessionStore();
    const statistics = mockStatistics();
    const selector = mockSelector([0, 1, 2]);

    const controller = new InfiniteQuizController(problems, store as unknown as SessionStore, statistics as unknown as AnswerStatistics, selector);
    controller.start();
    const wrongChoice = controller.currentChoices.find((choice: Choice) => !choice.correct);
    controller.answer(wrongChoice);
    controller.submit();

    expect(statistics.record).toHaveBeenCalledWith(0, false);
    expect(controller.wrongQuestions).toEqual([0]);
    controller.next();
    expect(controller.questionNumber).toBe(2);

    controller.answer(controller.currentChoices.find((choice: Choice) => choice.correct));
    controller.submit();
    controller.next();

    expect(controller.questionNumber).toBe(3);
  });

  it("keeps failed answers on session reload and resumes at the first unanswered question", () => {
    const problems = mockProblems(2);
    const statistics = mockStatistics();
    const selector = mockSelector([0, 1]);
    const persistedData = { questionHash: "hash", selectedQuestions: [0, 1], answers: {}, choiceOrder: {}, index: 0, completed: [] as number[], failed: [] as number[] };
    const store = mockSessionStore({
      store: jest.fn((_key: string, data: typeof persistedData) => Object.assign(persistedData, data)),
      load: jest.fn().mockImplementation(() => persistedData),
    });

    const first = new InfiniteQuizController(problems, store as unknown as SessionStore, statistics as unknown as AnswerStatistics, selector);
    first.start();
    first.answer(first.currentChoices.find((choice: Choice) => !choice.correct));
    first.submit();
    first.pause();
    expect(first.wrongQuestions).toEqual([0]);

    const reloaded = new InfiniteQuizController(problems, store as unknown as SessionStore, statistics as unknown as AnswerStatistics, selector);
    reloaded.start();

    expect(reloaded.questionNumber).toBe(2);
    expect(reloaded.wrongQuestions).toEqual([0]);
  });

  it("reports remainingQuestions as problems without a submitted answer", () => {
    const problems = mockProblems(3);
    const store = mockSessionStore();
    const statistics = mockStatistics();
    const selector = mockSelector([0, 1, 2]);

    const controller = new InfiniteQuizController(problems, store as unknown as SessionStore, statistics as unknown as AnswerStatistics, selector);
    controller.start();
    expect(controller.remainingQuestions).toBe(3);
    controller.answer(controller.currentChoices.find((choice: Choice) => choice.correct));
    controller.submit();
    expect(controller.remainingQuestions).toBe(2);
    controller.next();
    controller.answer(controller.currentChoices.find((choice: Choice) => !choice.correct));
    controller.submit();
    expect(controller.remainingQuestions).toBe(1);
  });

  it("starts a retry pass with only failed questions after all questions in the pass were answered", () => {
    const problems = mockProblems(2);
    const store = mockSessionStore();
    const statistics = mockStatistics();
    const selector = mockSelector([0, 1]);

    const controller = new InfiniteQuizController(problems, store as unknown as SessionStore, statistics as unknown as AnswerStatistics, selector);
    controller.start();
    controller.answer(controller.currentChoices.find((choice: Choice) => !choice.correct));
    controller.submit();
    controller.next();
    controller.answer(controller.currentChoices.find((choice: Choice) => choice.correct));
    controller.submit();
    controller.next();

    expect(controller.isComplete).toBe(false);
    expect(controller.totalQuestions).toBe(1);
    expect(controller.questionNumber).toBe(1);
    expect(controller.wrongQuestions).toEqual([0]);
    expect(controller.remainingQuestions).toBe(1);
    expect(controller.answeredCount).toBe(1);
    expect(controller.currentAnswerCorrect).toBeUndefined();
  });

  it("finishes the infinite quiz after a retry pass has no failed questions left", () => {
    const problems = mockProblems(2);
    const store = mockSessionStore();
    const statistics = mockStatistics();
    const selector = mockSelector([0, 1]);

    const controller = new InfiniteQuizController(problems, store as unknown as SessionStore, statistics as unknown as AnswerStatistics, selector);
    controller.start();
    controller.answer(controller.currentChoices.find((choice: Choice) => !choice.correct));
    controller.submit();
    controller.next();
    controller.answer(controller.currentChoices.find((choice: Choice) => choice.correct));
    controller.submit();
    controller.next();

    controller.answer(controller.currentChoices.find((choice: Choice) => choice.correct));
    controller.submit();
    controller.next();

    expect(controller.isComplete).toBe(true);
    expect(controller.wrongQuestions).toEqual([]);
    expect(controller.answeredCount).toBe(2);
  });
});
