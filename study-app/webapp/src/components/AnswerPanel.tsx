import type { JSX } from "react";
import type { Choice } from "../model/Choice";
import type { InfiniteQuizController } from "../controllers/InfiniteQuizController";
import type { TimedQuizController } from "../controllers/TimedQuizController";
import { choiceLabel } from "./choiceLabel";
import { choiceShortcutKey } from "./choiceShortcutKey";

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

  const toggle = (choice: Choice): void => controller.answer(choice);

  return (
    <div className="answer-panel">
      {multiple && !submitted && <p className="answer-hint">Select {required} answers ({selected.length} selected)</p>}
      {submitted && <p className={`feedback ${answerCorrect ? "success" : "error"}`}>{answerCorrect ? "Correct!" : "Incorrect."}</p>}
      <div className="choices">
        {choices.map((choice, index) => {
          const shortcutKey = choiceShortcutKey(index);
          const isSelected = selected.some((item) => item?.solution === choice.solution);
          // Reveal correctness only after submitting; a pending selection is just "selected".
          const revealed = submitted && (isSelected || Boolean(choice.correct));
          const className = revealed ? (choice.correct ? "correct" : isSelected ? "incorrect" : "") : isSelected ? "selected" : "";
          const showExplanation = submitted && (isSelected || Boolean(choice.correct)) && choice.explanation;
          return (
            <div className="choice-result" key={index}>
              <button
                className={className}
                onClick={() => toggle(choice)}
                disabled={submitted}
              >
                <span>{choiceLabel(index)}. {choice.solution}</span>
                {shortcutKey && !submitted && <kbd className="choice-shortcut" title={`Press ${shortcutKey} to select this answer`}>{shortcutKey}</kbd>}
              </button>
              {showExplanation && <p className="choice-explanation">{choice.explanation}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
