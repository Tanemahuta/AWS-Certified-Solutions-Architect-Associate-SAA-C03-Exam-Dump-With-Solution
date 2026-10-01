import type { JSX } from "react";
interface ProgressSummaryProps {
  answered: number;
  incorrect: number;
  successRate: number;
  remaining?: number;
}

export function ProgressSummary({ answered, incorrect, successRate, remaining }: ProgressSummaryProps): JSX.Element {
  return <span className="progress-summary">{answered} answered ({incorrect} incorrect) · {Math.round(successRate * 100)}% success{remaining === undefined ? "" : ` · ${remaining} remaining`}</span>;
}
