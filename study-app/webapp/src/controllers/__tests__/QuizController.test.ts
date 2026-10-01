import { mockProblem, mockProblems } from "../../test-support/mockProblem";
import { mockSessionStore } from "../../test-support/mockSessionStore";
import type { AnswerStatistics } from "../../persistence/AnswerStatistics";
import type { SessionStore } from "../../persistence/session/SessionStore";
import type { QuestionSelector } from "../../services/QuestionSelector";
import type { Problem } from "../../model/Problem";
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

function makeController(problems: Problem[], selected: number[]) {
  const store = mockSessionStore();
  const statistics = mockStatistics();
  const controller = new InfiniteQuizController(problems, store as unknown as SessionStore, statistics as unknown as AnswerStatistics, mockSelector(selected));
  controller.start();
  return { controller, statistics };
}

const multiProblem = mockProblem({
  choices: [
    { solution: "A", correct: true },
    { solution: "B", correct: true },
    { solution: "C" },
    { solution: "D" },
  ],
});

describe("QuizController selection model", () => {
  it("requires one selection for a single-choice question", () => {
    const { controller } = makeController(mockProblems(1), [0]);
    expect(controller.requiredSelections).toBe(1);
    expect(controller.canSubmit).toBe(false);

    controller.answer(controller.currentChoices[0]);
    expect(controller.canSubmit).toBe(true);
  });

  it("requires as many selections as there are correct choices for a multi-choice question", () => {
    const { controller } = makeController([multiProblem], [0]);
    expect(controller.requiredSelections).toBe(2);

    const [a, b] = controller.currentChoices.filter((choice) => choice.correct);
    controller.answer(a);
    expect(controller.canSubmit).toBe(false);
    controller.answer(b);
    expect(controller.canSubmit).toBe(true);
  });

  it("unselects a selected choice when selecting it again", () => {
    const { controller } = makeController(mockProblems(1), [0]);
    const choice = controller.currentChoices[0];
    controller.answer(choice);
    expect(controller.selectedChoices).toEqual([choice]);
    controller.answer(choice);
    expect(controller.selectedChoices).toEqual([]);
    expect(controller.canSubmit).toBe(false);
  });

  it("replaces the previous selection instead of accumulating for single-choice questions", () => {
    const { controller } = makeController(mockProblems(1), [0]);
    const [first, second] = controller.currentChoices;
    controller.answer(first);
    controller.answer(second);
    expect(controller.selectedChoices).toEqual([second]);
  });

  it("refuses selections beyond the required amount for multi-choice questions", () => {
    const { controller } = makeController([multiProblem], [0]);
    controller.answer(controller.currentChoices[0]);
    controller.answer(controller.currentChoices[1]);
    controller.answer(controller.currentChoices[2]);
    expect(controller.selectedChoices).toHaveLength(2);
  });

  it("does not record anything until submit is called", () => {
    const { controller, statistics } = makeController(mockProblems(1), [0]);
    controller.answer(controller.currentChoices[0]);
    expect(statistics.record).not.toHaveBeenCalled();
    expect(controller.hasSubmitted).toBe(false);
    expect(controller.answeredCount).toBe(0);
  });

  it("submit is a no-op while the required amount of selections is missing", () => {
    const { controller, statistics } = makeController([multiProblem], [0]);
    controller.answer(controller.currentChoices.find((choice) => choice.correct));
    controller.submit();
    expect(statistics.record).not.toHaveBeenCalled();
    expect(controller.hasSubmitted).toBe(false);
  });

  it("blocks further selection changes after submitting", () => {
    const { controller } = makeController(mockProblems(1), [0]);
    controller.answer(controller.currentChoices[0]);
    controller.submit();
    expect(controller.hasSubmitted).toBe(true);
    controller.answer(controller.currentChoices[1]);
    expect(controller.selectedChoices).toHaveLength(1);
    expect(controller.canSubmit).toBe(false);
  });

  it("reports whether the submitted answer was correct", () => {
    const { controller } = makeController(mockProblems(1), [0]);
    expect(controller.currentAnswerCorrect).toBeUndefined();
    controller.answer(controller.currentChoices.find((choice) => choice.correct));
    controller.submit();
    expect(controller.currentAnswerCorrect).toBe(true);
  });

  it("reports an incorrect submission as incorrect", () => {
    const { controller } = makeController(mockProblems(1), [0]);
    controller.answer(controller.currentChoices.find((choice) => !choice.correct));
    controller.submit();
    expect(controller.currentAnswerCorrect).toBe(false);
    expect(controller.incorrectCount).toBe(1);
  });

  it("includes faulty submitted questions in the status counts", () => {
    const { controller } = makeController(mockProblems(2), [0, 1]);
    controller.answer(controller.currentChoices.find((choice) => !choice.correct));
    controller.submit();
    controller.next();
    controller.answer(controller.currentChoices.find((choice) => choice.correct));
    controller.submit();

    expect(controller.answeredCount).toBe(2);
    expect(controller.incorrectCount).toBe(1);
    expect(controller.successRate).toBe(0.5);
  });

  it("counts a multi-choice submission as correct only when exactly all correct choices were selected", () => {
    const { controller } = makeController([multiProblem], [0]);
    const correctChoice = controller.currentChoices.find((choice) => choice.correct);
    const wrongChoice = controller.currentChoices.find((choice) => !choice.correct);
    controller.answer(correctChoice);
    controller.answer(wrongChoice);
    controller.submit();
    expect(controller.currentAnswerCorrect).toBe(false);
  });

  it("counts a multi-choice submission as correct when exactly all correct choices were selected", () => {
    const { controller } = makeController([multiProblem], [0]);
    controller.currentChoices.filter((choice) => choice.correct).forEach((choice) => controller.answer(choice));
    controller.submit();
    expect(controller.currentAnswerCorrect).toBe(true);
  });

  it("marks the question as unanswered when next is called without a submission", () => {
    const { controller, statistics } = makeController(mockProblems(2), [0, 1]);
    controller.next();
    expect(statistics.record).toHaveBeenCalledWith(0, false);
    expect(controller.questionNumber).toBe(2);
  });

  it("does not advance when submitting is still pending and next would otherwise mark unanswered", () => {
    const { controller } = makeController(mockProblems(2), [0, 1]);
    controller.answer(controller.currentChoices[0]);
    controller.next();
    expect(controller.questionNumber).toBe(1);
    expect(controller.hasSubmitted).toBe(false);
  });
});
