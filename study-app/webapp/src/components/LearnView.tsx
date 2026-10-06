import type { JSX, PointerEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import type { Problem } from "../model/Problem";
import { SessionStore } from "../persistence/session/SessionStore";
import type { SessionData } from "../persistence/session/SessionData";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { ChoiceList, QuestionHeading } from "./QuestionContent";
import { useQuestionScroll } from "../hooks/useQuestionScroll";
import { GoToQuestionDialog } from "./GoToQuestionDialog";

export const LEARN_SESSION_KEY = "saa-exam-learn-session";
interface LearnSession extends SessionData { questionNumber: number }
interface LearnViewProps { problems: readonly Problem[]; questionHash: string; onBack: () => void }

export function LearnView({ problems, questionHash, onBack }: LearnViewProps): JSX.Element {
  const store = useMemo(() => new SessionStore(questionHash), [questionHash]);
  const navigate = useNavigate();
  const { questionNumber } = useParams();
  const index = /^[1-9]\d*$/.test(questionNumber ?? "")
    ? problems.findIndex(item => item.questionNumber === Number(questionNumber)) : -1;
  const goTo = (position: number): void => {
    const next = problems[position];
    if (next) navigate(`/learn/${next.questionNumber}`);
  };
  const problem = problems[index];
  const [goToOpen, setGoToOpen] = useState(false);
  const swipe = useRef<{ x: number; y: number; id: number } | undefined>(undefined);
  useQuestionScroll(problem?.questionNumber);
  const swipeStart = (event: PointerEvent): void => {
    if (event.pointerType !== "touch") return;
    if (!event.isPrimary || goToOpen || (event.target as Element).closest("button, input, select, textarea, a, dialog, code")) {
      swipe.current = undefined;
      return;
    }
    swipe.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
  };
  const swipeEnd = (event: PointerEvent): void => {
    const start = swipe.current;
    swipe.current = undefined;
    if (!start || start.id !== event.pointerId || goToOpen) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    goTo(Math.min(problems.length - 1, Math.max(0, index + (dx < 0 ? 1 : -1))));
  };
  useEffect(() => {
    if (problem) store.store<LearnSession>(LEARN_SESSION_KEY, { questionNumber: problem.questionNumber });
  }, [problem, store]);
  useKeyboardShortcuts([
    { key: "ArrowLeft", action: () => goTo(index - 1), enabled: !goToOpen && index > 0 },
    { key: "ArrowRight", action: () => goTo(index + 1), enabled: !goToOpen && index < problems.length - 1 },
  ]);
  if (problems.length > 0 && !problem) return <Navigate to="/learn" replace />;
  return <main className="app learn-swipe" onPointerDown={swipeStart} onPointerUp={swipeEnd} onPointerCancel={() => { swipe.current = undefined; }}><section className="card learn-card">
    <header><button className="button button--secondary button--icon" onClick={onBack} aria-label="Home" title="Home"><span className="icon mdi mdi-home" aria-hidden="true" /></button><span>Learn mode · {problem && <>Question {problem.questionNumber} · </>}{problem ? index + 1 : 0} of {problems.length}</span></header>
    {problem ? <><QuestionHeading problem={problem} /><ChoiceList choices={problem.choices} />
      <nav className="actions learn-navigation" aria-label="Learning questions">
        <button className="button button--primary" onClick={() => goTo(index - 1)} disabled={index === 0}><span className="icon mdi mdi-arrow-left" aria-hidden="true" />Previous question</button>
        <button className="button button--secondary" onClick={() => setGoToOpen(true)}>Go to</button>
        <button className="button button--primary" onClick={() => goTo(index + 1)} disabled={index === problems.length - 1}>Next question<span className="icon mdi mdi-arrow-right" aria-hidden="true" /></button>
      </nav></> : <p>No questions available.</p>}
  </section>{goToOpen && <GoToQuestionDialog current={index + 1} total={problems.length} onClose={() => setGoToOpen(false)} onGo={position => { goTo(position - 1); setGoToOpen(false); }} />}</main>;
}

/** The entry route resumes saved learning progress without duplicating it in UI state. */
export function LearnEntry(props: LearnViewProps): JSX.Element {
  const saved = new SessionStore(props.questionHash).load<LearnSession>(LEARN_SESSION_KEY)?.questionNumber;
  const problem = props.problems.find(item => item.questionNumber === saved) ?? props.problems[0];
  return problem ? <Navigate to={`/learn/${problem.questionNumber}`} replace /> : <LearnView {...props} />;
}
