import type { JSX } from "react";
interface HomeViewProps {
  questionCount: number;
  onInfinite: () => void;
  onTimed: () => void;
  onReports: () => void;
  onClearBrowserData: () => void;
}

export function HomeView({ questionCount, onInfinite, onTimed, onReports, onClearBrowserData }: HomeViewProps): JSX.Element {
  return <main className="app"><section className="card"><h1>Home</h1><p>AWS SAA-C03 Exam Prep · {questionCount} questions</p><div className="actions controller"><button onClick={onInfinite}>Infinite test</button><button onClick={onTimed}>Timed test</button><button onClick={onReports}>Reports</button><button onClick={onClearBrowserData}>Clear browser data</button></div></section></main>;
}
