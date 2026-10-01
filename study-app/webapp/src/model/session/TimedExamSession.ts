import type { TimedSessionData } from "../../persistence/session/TimedSessionData";
import { ExamSession } from "./ExamSession";

/**
 * Plain state for a timed exam session: the questions selected, answers, choice order, and the
 * time remaining.
 */
export class TimedExamSession extends ExamSession {
  private constructor(
    selectedQuestions: readonly number[],
    public remainingSeconds: number,
    index = 0,
  ) {
    super(selectedQuestions, index);
  }

  public static create(selectedQuestions: readonly number[], remainingSeconds: number): TimedExamSession {
    return new TimedExamSession(selectedQuestions, remainingSeconds);
  }

  public static fromData(data: TimedSessionData): TimedExamSession {
    const session = new TimedExamSession(data.selectedQuestions, data.remainingSeconds);
    ExamSession.restoreBase(data, session);
    return session;
  }

  public get data(): Omit<TimedSessionData, "questionHash"> {
    return {
      ...this.baseData,
      remainingSeconds: this.remainingSeconds,
    };
  }
}
