import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import type { Problem } from "../model/Problem";
import { SessionStore } from "../persistence/session/SessionStore";
import type { SessionData } from "../persistence/session/SessionData";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { ChoiceList, QuestionHeading } from "./QuestionContent";
import { Icon } from "./Icon";

export const LEARN_SESSION_KEY = "saa-exam-learn-session";
interface LearnSession extends SessionData { questionNumber: number }
interface LearnViewProps { problems: readonly Problem[]; questionHash: string; onBack: () => void }

export function LearnView({ problems, questionHash, onBack }: LearnViewProps): JSX.Element {
  const store = useMemo(() => new SessionStore(questionHash), [questionHash]);
  const [index, setIndex] = useState(() => {
    const saved = store.load<LearnSession>(LEARN_SESSION_KEY)?.questionNumber;
    return Math.max(0, problems.findIndex(problem => problem.questionNumber === saved));
  });
  const problem = problems[index];
  useEffect(() => {
    if (problem) store.store<LearnSession>(LEARN_SESSION_KEY, { questionNumber: problem.questionNumber });
  }, [problem, store]);
  useKeyboardShortcuts([
    { key: "ArrowLeft", action: () => setIndex(index - 1), enabled: index > 0 },
    { key: "ArrowRight", action: () => setIndex(index + 1), enabled: index < problems.length - 1 },
  ]);
  return <main className="app"><section className="card learn-card">
    <header><button onClick={onBack}><Icon name="home" />Home</button><span>Learn mode · {problem ? index + 1 : 0} of {problems.length}</span></header>
    {problem ? <><p className="question-number">Question {problem.questionNumber}</p><QuestionHeading problem={problem} /><ChoiceList choices={problem.choices} />
      <nav className="actions learn-navigation" aria-label="Learning questions">
        <button onClick={() => setIndex(index - 1)} disabled={index === 0}><Icon name="previous" />Previous question</button>
        <label>Go to question<select aria-label="Go to question" value={index} onChange={event => setIndex(Number(event.target.value))}>{problems.map((item, position) => <option key={item.questionNumber} value={position}>Question {item.questionNumber}</option>)}</select></label>
        <button onClick={() => setIndex(index + 1)} disabled={index === problems.length - 1}>Next question<Icon name="next" /></button>
      </nav></> : <p>No questions available.</p>}
  </section></main>;
}
