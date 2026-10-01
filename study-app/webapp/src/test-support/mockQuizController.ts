import { InfiniteQuizController } from "../controllers/InfiniteQuizController";
import type { Problem } from "../model/Problem";
import type { AnswerStatistics } from "../persistence/AnswerStatistics";
import type { SessionStore } from "../persistence/session/SessionStore";
import { mockSessionStore } from "./mockSessionStore";

/**
 * Builds a started {@link InfiniteQuizController} that walks through `problems` in order, backed by
 * mocked persistence, for component tests.
 */
export function startedInfiniteController(problems: Problem[]): InfiniteQuizController {
  const statistics = { record: jest.fn(), clear: jest.fn(), get: jest.fn(), failureRate: jest.fn().mockReturnValue(0), priority: jest.fn().mockReturnValue(3) };
  const selector = { select: jest.fn().mockReturnValue(problems.map((_problem, index) => index)) };
  const controller = new InfiniteQuizController(problems, mockSessionStore() as unknown as SessionStore, statistics as unknown as AnswerStatistics, selector);
  controller.start();
  return controller;
}
