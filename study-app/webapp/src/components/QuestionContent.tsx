import type { JSX, ReactNode } from "react";
import type { Problem } from "../model/Problem";
import type { Choice } from "../model/Choice";
import { choiceLabel } from "./choiceLabel";
import { choiceShortcutKey } from "./choiceShortcutKey";

/** Render the supported code markers as text, never as executable HTML. */
export function QuestionText({ text }: { text: string }): JSX.Element {
  const parts = text.split(/(<code>[\s\S]*?<\/code>)/gi);
  return <>{parts.map((part, index) => /^<code>/i.test(part)
    ? <code className="code-block" key={index}>{part.slice(6, -7)}</code>
    : <span key={index}>{part.split(/\r?\n/).map((line, lineIndex) => <span key={lineIndex}>{lineIndex > 0 && <br />}{line}</span>)}</span>)}</>;
}

export function QuestionHeading({ problem }: { problem: Problem }): JSX.Element {
  return <h1 className="question-text"><QuestionText text={problem.question} /></h1>;
}

interface ChoiceListProps {
  choices: readonly Choice[];
  selected?: readonly Choice[];
  revealed?: boolean;
  onSelect?: (choice: Choice) => void;
  showAllExplanations?: boolean;
}

export function ChoiceList({ choices, selected = [], revealed = true, onSelect, showAllExplanations = false }: ChoiceListProps): JSX.Element {
  return <div className="choices">{choices.map((choice, index) => {
    const isSelected = selected.some(item => item.solution === choice.solution);
    const className = revealed ? choice.correct ? "correct" : isSelected ? "incorrect" : "" : isSelected ? "selected" : "";
    const explanation = revealed && (showAllExplanations || choice.correct || isSelected) && choice.explanation;
    const content: ReactNode = <><span><span>{choiceLabel(index)}. </span><QuestionText text={choice.solution} /></span>{onSelect && !revealed && <kbd className="choice-shortcut">{choiceShortcutKey(index)}</kbd>}</>;
    return <div className="choice-result" key={index}>
      {onSelect ? <button className={className} onClick={() => onSelect(choice)} disabled={revealed}>{content}</button>
        : <div className={`report-answer ${className}`}>{content}</div>}
      {explanation && <div className={`choice-explanation ${choice.correct ? "explanation-correct" : ""}`}><QuestionText text={choice.explanation ?? ""} /></div>}
    </div>;
  })}</div>;
}
