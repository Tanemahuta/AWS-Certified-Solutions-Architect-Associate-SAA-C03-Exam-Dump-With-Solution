import type { JSX } from "react";
import { Icon } from "./Icon";
interface HomeViewProps { questionCount: number; onLearn: () => void }

export function HomeView({ questionCount, onLearn }: HomeViewProps): JSX.Element {
  return <main className="app"><section className="card home-card"><span className="eyebrow">AWS SAA-C03</span><h1>Your next step toward certification</h1><p>Explore {questionCount} questions with answers and explanations, then test what you know.</p><button className="learn-start" onClick={onLearn}><Icon name="learn" />Learn mode<Icon name="next" /></button><p className="home-help">Open the menu to test all questions, take a timed test, or view your statistics. Your learning progress is saved automatically.</p></section></main>;
}
