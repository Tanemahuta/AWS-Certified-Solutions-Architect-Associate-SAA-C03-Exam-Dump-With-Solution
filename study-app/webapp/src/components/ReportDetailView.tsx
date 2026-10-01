import type { JSX } from "react";
import { Navigate, useParams } from "react-router-dom";
import type { Problem } from "../model/Problem";
import { choiceLabel } from "./choiceLabel";

interface ReportDetailViewProps {
  problems: readonly Problem[];
  domains: readonly string[];
  onBack: () => void;
}

function reportQuestionIndex(questionNumber?: string): number | undefined {
  const parsed = Number(questionNumber);
  return Number.isInteger(parsed) && parsed > 0 ? parsed - 1 : undefined;
}

/**
 * Shows a single question of the report, addressed by the 1-based `:questionNumber` route parameter,
 * with all choices, the correct answers highlighted and their explanations.
 */
export function ReportDetailView({ problems, domains, onBack }: ReportDetailViewProps): JSX.Element {
  const { questionNumber } = useParams();
  const index = reportQuestionIndex(questionNumber);
  const problem = index === undefined ? undefined : problems[index];
  if (index === undefined || !problem) return <Navigate to="/reports" replace />;
  return <main className="app"><section className="card"><header><button onClick={onBack}>Back to report</button><span>Question {problem.questionNumber} · {domains[index]}</span></header><h1 className="question-text">{problem.question.split(/\r?\n/).map((line, lineIndex) => <span key={lineIndex}>{lineIndex > 0 && <br/>}{line}</span>)}</h1><div className="choices">{problem.choices.map((choice, choiceIndex) => <div className="choice-result" key={choiceIndex}><div className={choice.correct ? "report-answer correct" : "report-answer"}>{choiceLabel(choiceIndex)}. {choice.solution}</div>{choice.explanation && <p className="choice-explanation">{choice.explanation}</p>}</div>)}</div></section></main>;
}
