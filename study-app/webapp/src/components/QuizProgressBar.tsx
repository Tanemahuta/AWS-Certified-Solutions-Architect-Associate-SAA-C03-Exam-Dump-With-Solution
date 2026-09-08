import type { JSX } from "react";
interface QuizProgressBarProps {
  value: number;
  max: number;
  label: string;
  showLabel?: boolean;
}

export function QuizProgressBar({ value, max, label, showLabel = true }: QuizProgressBarProps): JSX.Element {
  return <div className="quiz-progress" aria-label={label}>
    <progress value={value} max={max} />
    {showLabel && <span>{label}</span>}
  </div>;
}
