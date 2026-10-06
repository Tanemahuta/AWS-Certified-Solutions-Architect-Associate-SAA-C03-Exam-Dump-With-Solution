import type { JSX } from "react";
import type { InfiniteQuizController } from "../controllers/InfiniteQuizController";
import type { TimedQuizController } from "../controllers/TimedQuizController";
import { ChoiceList } from "./QuestionContent";

interface AnswerPanelProps {
  controller: TimedQuizController | InfiniteQuizController;
}

/**
 * The answer interaction for the current question: a list of choices the user selects/unselects,
 * a hint about how many answers are required, and a submit button that stays disabled until the
 * required amount has been selected. After submitting, the correct answers and explanations are
 * revealed.
 */
export function AnswerPanel({ controller }: AnswerPanelProps): JSX.Element {
  const choices = controller.currentChoices;
  const selected = controller.selectedChoices;
  const submitted = controller.hasSubmitted;
  const required = controller.requiredSelections;
  const multiple = required > 1;
  const answerCorrect = controller.currentAnswerCorrect;

  return (
    <div className="answer-panel">
      {multiple && !submitted && <p className="answer-hint">Select {required} answers ({selected.length} selected)</p>}
      {submitted && <p className={`feedback ${answerCorrect ? "success" : "error"}`}>{answerCorrect ? "Correct!" : "Incorrect."}</p>}
      <ChoiceList choices={choices} selected={selected} revealed={submitted} showAllExplanations={submitted && answerCorrect === false} onSelect={choice => controller.answer(choice)} />
    </div>
  );
}
