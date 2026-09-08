import type { JSX } from "react";
import { useMemo, useSyncExternalStore } from "react";
import type { InfiniteQuizController } from "../controllers/InfiniteQuizController";
import type { TimedQuizController } from "../controllers/TimedQuizController";
import { TIMED_EXAM_TIME_LIMIT_SECONDS } from "../config/examConfig";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { AnswerPanel } from "./AnswerPanel";
import { choiceShortcutKey } from "./choiceShortcutKey";
import { ProgressSummary } from "./ProgressSummary";
import { QuizProgressBar } from "./QuizProgressBar";

interface QuizViewProps {
  controller: TimedQuizController | InfiniteQuizController;
  timed: boolean;
  onBack: () => void;
  onPause?: () => void;
  onRestart: () => void;
  onNext: () => void;
}

export function QuizView({ controller, timed, onBack, onPause, onRestart, onNext }: QuizViewProps): JSX.Element {
  useSyncExternalStore(controller.subscribe.bind(controller), () => controller.stateVersion, () => controller.stateVersion);
  const current = controller.currentQuestion;
  const remainingSeconds = timed ? (controller as TimedQuizController).remainingSeconds : undefined;
  const remaining = !timed ? (controller as InfiniteQuizController).remainingQuestions : undefined;
  const timedRemainingQuestions = timed ? controller.totalQuestions - controller.answeredCount : undefined;
  const minutes = Math.floor((remainingSeconds ?? 0) / 60).toString().padStart(2, "0");
  const seconds = ((remainingSeconds ?? 0) % 60).toString().padStart(2, "0");
  const progressMax = timed ? TIMED_EXAM_TIME_LIMIT_SECONDS : controller.totalQuestions;
  const progressValue = timed ? remainingSeconds ?? 0 : remaining ?? controller.totalQuestions;
  const progressLabel = timed ? "Time remaining" : `${remaining ?? controller.totalQuestions} questions remaining`;
  // "n" submits the pending selection (advancing immediately when correct), otherwise advances.
  // Navigation goes through onNext so the parent can handle session completion (results view).
  const submitOrNext = (): void => {
    if (controller.hasSubmitted) {
      onNext();
      return;
    }
    controller.submit();
    if (controller.currentAnswerCorrect === true) onNext();
  };
  const shortcuts = useMemo(() => [
    { key: "n", action: submitOrNext },
    ...controller.currentChoices.flatMap((choice, index) => {
      const key = choiceShortcutKey(index);
      return key ? [{ key, action: () => controller.answer(choice), enabled: !controller.hasSubmitted }] : [];
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [controller, controller.currentChoices, controller.hasSubmitted]);
  useKeyboardShortcuts(shortcuts);
  return <main className="app"><section className="card quiz-card"><header className="quiz-header"><button onClick={onBack}>Back</button><div className="quiz-status"><span>Question {controller.questionNumber} of {controller.totalQuestions}</span>{timed && <QuizProgressBar value={timedRemainingQuestions ?? 0} max={controller.totalQuestions} label={`${timedRemainingQuestions ?? 0} questions remaining`}/>}<QuizProgressBar value={progressValue} max={progressMax} label={progressLabel} showLabel={!timed}/>{timed && <strong className="timer">{minutes}:{seconds}</strong>}</div>{timed ? <button onClick={onPause}>Pause</button> : <button onClick={onRestart}>Restart</button>}</header><h1 className="question-text">{current.question.split(/\r?\n/).map((line, index) => <span key={index}>{index > 0 && <br/>}{line}</span>)}</h1><AnswerPanel controller={controller}/><div className="actions">{timed && controller.questionNumber > 1 && <button onClick={() => controller.previous()}>Previous question</button>}<button onClick={submitOrNext} disabled={!controller.hasSubmitted && !controller.canSubmit}>{controller.hasSubmitted ? "Next question" : "Submit answer"} <kbd className="action-shortcut">N</kbd></button><ProgressSummary answered={controller.answeredCount} incorrect={controller.incorrectCount} successRate={controller.successRate} remaining={remaining}/>{timed && <button onClick={onRestart}>Restart</button>}</div></section></main>;
}
