import type { JSX } from "react";
import { Icon } from "./Icon";
interface HomeViewProps {
  questionCount: number; onLearn: () => void; onInfinite: () => void; onTimed: () => void;
  onReports: () => void; onClearBrowserData: () => void;
}

export function HomeView({ questionCount, onLearn, onInfinite, onTimed, onReports, onClearBrowserData }: HomeViewProps): JSX.Element {
  return <main className="app"><section className="card home-card"><span className="eyebrow">AWS SAA-C03</span><h1>Your next step toward certification</h1><p>Explore {questionCount} questions with answers and explanations, then test what you know.</p><div className="actions controller home-navigation"><button className="learn-start" onClick={onLearn}><Icon name="learn" />Learn mode</button><button onClick={onInfinite}><Icon name="test" />Test all questions</button><button onClick={onTimed}><Icon name="timer" />Timed test</button><button onClick={onReports}><Icon name="chart" />Statistics</button><button onClick={onClearBrowserData}><Icon name="trash" />Clear data</button></div><p className="home-help">Your learning progress is saved automatically.</p></section></main>;
}
