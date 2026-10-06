import type { JSX } from "react";
import { Icon } from "./Icon";
interface HomeViewProps {
  questionCount: number; onLearn: () => void; onInfinite: () => void; onTimed: () => void;
  onReports: () => void; onClearBrowserData: () => void;
}

export function HomeView({ questionCount, onLearn, onInfinite, onTimed, onReports, onClearBrowserData }: HomeViewProps): JSX.Element {
  return <main className="app"><section className="card home-card"><span className="eyebrow">AWS SAA-C03</span><h1>Your next step toward certification</h1><p>Explore {questionCount} questions with answers and explanations, then test what you know.</p><div className="home-navigation"><div className="actions controller"><button className="button button--primary button--learn" onClick={onLearn}><Icon name="learn" />Learn mode</button></div><div className="actions controller"><button className="button button--primary" onClick={onInfinite}><Icon name="test" />Test all questions</button><button className="button button--primary" onClick={onTimed}><Icon name="timer" />Timed test</button></div><div className="actions controller"><button className="button button--primary" onClick={onReports}><Icon name="chart" />Statistics</button><button className="button button--danger" onClick={onClearBrowserData}><Icon name="trash" />Clear all browser data</button></div></div><p className="home-help">Your learning progress is saved automatically in this browser’s local storage.</p></section></main>;
}
