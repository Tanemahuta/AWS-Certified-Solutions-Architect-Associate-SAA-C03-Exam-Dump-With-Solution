import type { JSX, ReactNode } from "react";
import type { Problem } from "../model/Problem";
import type { Choice } from "../model/Choice";
import { choiceLabel } from "./choiceLabel";
import { choiceShortcutKey } from "./choiceShortcutKey";
import { CodeBlock } from "./CodeBlock";

/** Render only supported paragraph, break, and code markers; other HTML stays inert. */
export function QuestionText({ text }: { text: string }): JSX.Element {
  const parts = text.split(/(<code(?: class="language-[\w-]+")?>[\s\S]*?<\/code>|<p>[\s\S]*?<\/p>|<br\s*\/?>)/gi);
  return <>{parts.map((part, index) => /^<code(?: class="language-[\w-]+")?>/i.test(part)
    ? <CodeBlock key={index} code={part.slice(part.indexOf(">") + 1, -7)} language={/^<code class="language-([\w-]+)">/i.exec(part)?.[1].toLowerCase()} />
    : /^<p>/i.test(part) ? <p key={index}><QuestionText text={part.slice(3, -4)} /></p>
    : /^<br\s*\/?>$/i.test(part) ? <br key={index} />
    : <span key={index}>{part.split(/\r?\n/).map((line, lineIndex) => <span key={lineIndex}>{lineIndex > 0 && <br />}{line}</span>)}</span>)}</>;
}

export function QuestionHeading({ problem }: { problem: Problem }): JSX.Element {
  return <div className="question-text" role="heading" aria-level={1}><QuestionText text={problem.question} /></div>;
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
    const content: ReactNode = <><div className="choice-content"><span>{choiceLabel(index)}.</span><div><QuestionText text={choice.solution} /></div></div>{onSelect && !revealed && <kbd className="choice-shortcut">{choiceShortcutKey(index)}</kbd>}</>;
    return <div className="choice-result" key={index}>
      {onSelect ? <button className={`button button--choice ${className}`} onClick={() => onSelect(choice)} disabled={revealed}>{content}</button>
        : <div className={`report-answer ${className}`}>{content}</div>}
      {explanation && <div className={`choice-explanation ${choice.correct ? "explanation-correct" : ""}`}><QuestionText text={choice.explanation ?? ""} /></div>}
    </div>;
  })}</div>;
}
