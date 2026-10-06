import type { JSX } from "react";
import { Icon } from "./Icon";
import { Link } from "react-router-dom";

interface ResultsViewProps {
  score: number;
  total: number;
  scaledScore: number;
  maximumScore: number;
  passingScore: number;
  unscoredCount: number;
  wrongQuestions: readonly number[];
  questionNumbers?: readonly number[];
  onBack: () => void;
}

export function ResultsView(props: ResultsViewProps): JSX.Element {
  const passed = props.scaledScore >= props.passingScore;
  return <main className="app"><section className="card"><h1>Quiz complete</h1><p>Score: {props.scaledScore} / {props.maximumScore} ({props.score} correct, {props.unscoredCount} unscored of {props.total} questions)</p><h2>{passed ? "Passed" : "Not passed"} ({props.passingScore} required)</h2>{props.wrongQuestions.length > 0 && <><h2>Questions to review</h2><ul>{props.wrongQuestions.map((question) => <li key={question}><Link className="question-link" to={`/reports/${question + 1}`}>Question {props.questionNumbers?.[question] ?? question + 1}</Link></li>)}</ul></>}</section><button className="button button--secondary button--icon" onClick={props.onBack} aria-label="Home" title="Home"><Icon name="home" /></button></main>;
}
