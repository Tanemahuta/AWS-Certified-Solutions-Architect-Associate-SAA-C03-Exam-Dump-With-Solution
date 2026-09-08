import { mockProblems } from "../../test-support/mockProblem";
import { mockSessionStore } from "../../test-support/mockSessionStore";
import type { AnswerStatistics } from "../../persistence/AnswerStatistics";
import type { SessionStore } from "../../persistence/session/SessionStore";
import type { QuestionSelector } from "../../services/QuestionSelector";
import { TimedQuizController } from "../TimedQuizController";

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

describe("TimedQuizController", () => {
  it("starts a fresh session by asking the selector for 65 questions", () => {
    const problems = mockProblems(10);
    const store = mockSessionStore();
    const statistics = mockStatistics();
    const selector = mockSelector([0, 1, 2]);

    const controller = new TimedQuizController(problems, store as unknown as SessionStore, statistics as unknown as AnswerStatistics, selector);
    controller.start();

    expect(selector.select).toHaveBeenCalledWith(problems, 65);
    expect(controller.totalQuestions).toBe(3);
    expect(controller.questionNumber).toBe(1);
  });

  it("restores a persisted session instead of selecting new questions when one exists", () => {
    const problems = mockProblems(10);
    const store = mockSessionStore({
      load: jest.fn().mockReturnValue({
        questionHash: "hash",
        selectedQuestions: [4, 5, 6],
        answers: {},
        choiceOrder: {},
        index: 0,
        remainingSeconds: 100,
      }),
    });
    const statistics = mockStatistics();
    const selector = mockSelector([0, 1, 2]);

    const controller = new TimedQuizController(problems, store as unknown as SessionStore, statistics as unknown as AnswerStatistics, selector);
    controller.start();

    expect(selector.select).not.toHaveBeenCalled();
    expect(controller.totalQuestions).toBe(3);
    expect(controller.remainingSeconds).toBe(100);
  });

  it("records an answer via AnswerStatistics.record once submitted", () => {
    const problems = mockProblems(3);
    const store = mockSessionStore();
    const statistics = mockStatistics();
    const selector = mockSelector([0, 1, 2]);

    const controller = new TimedQuizController(problems, store as unknown as SessionStore, statistics as unknown as AnswerStatistics, selector);
    controller.start();
    controller.answer(controller.currentChoices.find((choice) => choice.correct));
    expect(statistics.record).not.toHaveBeenCalled();
    controller.submit();

    expect(statistics.record).toHaveBeenCalledWith(0, true);
    expect(controller.answeredCount).toBe(1);
  });

  it("persists the session to the store on pause", () => {
    const problems = mockProblems(3);
    const store = mockSessionStore();
    const statistics = mockStatistics();
    const selector = mockSelector([0, 1, 2]);

    const controller = new TimedQuizController(problems, store as unknown as SessionStore, statistics as unknown as AnswerStatistics, selector);
    controller.start();
    controller.pause();

    expect(store.store).toHaveBeenCalledWith("saa-exam-timed-session", expect.objectContaining({ selectedQuestions: [0, 1, 2] }));
  });

  it("clears statistics via the injected AnswerStatistics", () => {
    const problems = mockProblems(3);
    const store = mockSessionStore();
    const statistics = mockStatistics();
    const selector = mockSelector([0, 1, 2]);

    const controller = new TimedQuizController(problems, store as unknown as SessionStore, statistics as unknown as AnswerStatistics, selector);
    controller.start();
    controller.clearStatistics();

    expect(statistics.clear).toHaveBeenCalled();
  });
});
