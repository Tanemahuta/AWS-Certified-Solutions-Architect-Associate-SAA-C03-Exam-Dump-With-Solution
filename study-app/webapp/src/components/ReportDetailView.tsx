import type { JSX } from "react";
import { Navigate, useParams } from "react-router-dom";
import type { Problem } from "../model/Problem";
import { ChoiceList, QuestionHeading } from "./QuestionContent";

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
  return <main className="app"><section className="card"><header><button className="button button--secondary" onClick={onBack}><span className="icon mdi mdi-chart-bar" aria-hidden="true" />Back to report</button><span>Question {problem.questionNumber} · {domains[index]}</span></header><QuestionHeading problem={problem} /><ChoiceList choices={problem.choices} showAllExplanations /></section></main>;
}
