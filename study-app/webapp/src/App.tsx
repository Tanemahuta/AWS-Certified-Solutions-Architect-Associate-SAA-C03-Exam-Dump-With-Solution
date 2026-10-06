import type { JSX } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { InfiniteQuizController } from "./controllers/InfiniteQuizController";
import { TimedQuizController } from "./controllers/TimedQuizController";
import { AnswerStatistics } from "./persistence/AnswerStatistics";
import type { AnswerStatisticsData } from "./persistence/AnswerStatistics";
import { SessionStore } from "./persistence/session/SessionStore";
import type { TimedSessionData } from "./persistence/session/TimedSessionData";
import type { InfiniteSessionData } from "./persistence/session/InfiniteSessionData";
import { loadQuestionDatabase } from "./persistence/QuestionDatabaseLoader";
import type { QuestionDatabase } from "./persistence/QuestionDatabaseLoader";
import { debug } from "./debug";
import { ScoringModel } from "./services/ScoringModel";
import { TimedQuestionSelector } from "./services/TimedQuestionSelector";
import { InfiniteQuestionSelector } from "./services/InfiniteQuestionSelector";
import { RandomizingQuestionSelector } from "./services/RandomizingQuestionSelector";
import { LearnView, LEARN_SESSION_KEY } from "./components/LearnView";
import { HomeView } from "./components/HomeView";
import { QuizView } from "./components/QuizView";
import { ReportView } from "./components/ReportView";
import type { ReportSort } from "./components/reportRows";
import { ResultsView } from "./components/ResultsView";
import { ReportDetailView } from "./components/ReportDetailView";

const scoring = new ScoringModel();

const TIMED_SESSION_KEY = "saa-exam-timed-session";
const INFINITE_SESSION_KEY = "saa-exam-infinite-session";
const STATISTICS_SESSION_KEY = "saa-exam-statistics";

type QuizMode = "timed" | "infinite";
type ActiveController = { timed: true; controller: TimedQuizController } | { timed: false; controller: InfiniteQuizController };

function modeFromPath(pathname: string): QuizMode | undefined {
  const mode = pathname.split("/")[1];
  return mode === "timed" || mode === "infinite" ? mode : undefined;
}

function modePath(timed: boolean): QuizMode {
  return timed ? "timed" : "infinite";
}

export function App(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const [questionDatabase, setQuestionDatabase] = useState<QuestionDatabase>();
  const [questionDatabaseError, setQuestionDatabaseError] = useState<string>();
  const [active, setActive] = useState<ActiveController>();
  const [timedController, setTimedController] = useState<TimedQuizController>();
  const [infiniteController, setInfiniteController] = useState<InfiniteQuizController>();
  const [score, setScore] = useState(0);
  const [reportStats, setReportStats] = useState<AnswerStatisticsData>({});
  const [hydrated, setHydrated] = useState(false);
  const [reportSort, setReportSort] = useState<ReportSort>("question");
  const [reportAscending, setReportAscending] = useState(true);
  const [, refresh] = useState(0);
  const initialized = useRef(false);
  const store = useRef<SessionStore | undefined>(undefined);
  const statistics = useRef<AnswerStatistics | undefined>(undefined);
  const categorized = useMemo(() => Object.entries(questionDatabase?.domains ?? {}).flatMap(([domain, questions]) => questions.map((problem) => ({ domain, problem }))), [questionDatabase]);
  const problems = useMemo(() => categorized.map(({ problem }) => problem).sort((left, right) => left.questionNumber - right.questionNumber), [categorized]);
  const domains = useMemo(() => problems.map((problem) => categorized.find((item) => item.problem === problem)?.domain ?? "Unknown"), [categorized, problems]);

  const activate = (mode: QuizMode, controller: TimedQuizController | InfiniteQuizController): void => {
    setActive(mode === "timed" ? { timed: true, controller: controller as TimedQuizController } : { timed: false, controller: controller as InfiniteQuizController });
  };

  const refreshStats = (): void => {
    if (statistics.current) setReportStats(statistics.current.snapshot);
  };

  useEffect(() => {
    loadQuestionDatabase().then(setQuestionDatabase).catch((error: unknown) => {
      setQuestionDatabaseError(error instanceof Error ? error.message : "Failed to load question database.");
    });
  }, []);

  useEffect(() => {
    if (!questionDatabase || initialized.current) return;
    initialized.current = true;

    const sessionStore = new SessionStore(questionDatabase.hash);
    store.current = sessionStore;
    const stats = new AnswerStatistics(sessionStore);
    statistics.current = stats;
    const timedSelector = new RandomizingQuestionSelector(new TimedQuestionSelector(domains, stats));
    const infiniteSelector = new RandomizingQuestionSelector(new InfiniteQuestionSelector());

    const restoredTimedController = sessionStore.load<TimedSessionData>(TIMED_SESSION_KEY)
      ? new TimedQuizController(problems, sessionStore, stats, timedSelector)
      : undefined;
    const restoredInfiniteController = sessionStore.load<InfiniteSessionData>(INFINITE_SESSION_KEY)
      ? new InfiniteQuizController(problems, sessionStore, stats, infiniteSelector)
      : undefined;

    restoredTimedController?.start();
    restoredInfiniteController?.start();
    // Restoring persisted sessions once the question database has loaded is a one-off sync with external storage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (restoredTimedController) setTimedController(restoredTimedController);
    if (restoredInfiniteController) setInfiniteController(restoredInfiniteController);

    const createFresh = {
      timed: (): TimedQuizController => {
        const controller = new TimedQuizController(problems, sessionStore, stats, timedSelector);
        controller.start();
        setTimedController(controller);
        return controller;
      },
      infinite: (): InfiniteQuizController => {
        const controller = new InfiniteQuizController(problems, sessionStore, stats, infiniteSelector);
        controller.start();
        setInfiniteController(controller);
        return controller;
      },
    };
    const restored = { timed: restoredTimedController, infinite: restoredInfiniteController };
    const initialMode = modeFromPath(location.pathname) ?? (restoredTimedController ? "timed" : restoredInfiniteController ? "infinite" : undefined);
    const initialController = initialMode ? restored[initialMode] ?? createFresh[initialMode]() : undefined;

    if (initialMode && initialController) activate(initialMode, initialController);
    refreshStats();
    setHydrated(true);
  }, [questionDatabase, problems, domains, location.pathname]);

  useEffect(() => {
    if (!active?.timed || modeFromPath(location.pathname) !== "timed") return;
    const controller = active.controller;
    const interval = window.setInterval(() => {
      controller.setRemainingSeconds(Math.max(0, controller.remainingSeconds - 1));
      refresh((value) => value + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [active, location.pathname]);

  const start = (timed: boolean): void => {
    if (!store.current || !statistics.current) return;
    const mode = modePath(timed);
    const controller = timed
      ? new TimedQuizController(problems, store.current, statistics.current, new RandomizingQuestionSelector(new TimedQuestionSelector(domains, statistics.current)))
      : new InfiniteQuizController(problems, store.current, statistics.current, new RandomizingQuestionSelector(new InfiniteQuestionSelector()));
    controller.restart();
    debug("started new controller", { timed });
    activate(mode, controller);
    if (timed) setTimedController(controller as TimedQuizController);
    else setInfiniteController(controller as InfiniteQuizController);
    setScore(0);
    navigate(`/${mode}/1`, { replace: true });
  };

  const resume = (timed: boolean): void => {
    const saved = timed ? timedController : infiniteController;
    const mode = modePath(timed);
    active?.controller.pause();
    if (!saved) {
      start(timed);
      return;
    }
    activate(mode, saved);
    debug("resumed controller", { timed, question: saved.questionNumber });
    navigate(`/${mode}/${saved.questionNumber}`, { replace: true });
  };

  const restart = (): void => {
    if (active) start(active.timed);
  };

  const clearStatistics = (): void => {
    if (!window.confirm("Clear all statistics? This cannot be undone.")) return;
    statistics.current?.clear();
    setReportStats({});
  };

  const exportStatistics = (): void => {
    if (!statistics.current) return;
    const blob = new Blob([JSON.stringify(statistics.current.snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `saa-exam-statistics-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importStatistics = (data: unknown): void => {
    if (!statistics.current) return;
    statistics.current.replaceAll(data);
    refreshStats();
  };

  const clearBrowserData = (): void => {
    if (!window.confirm("Clear all browser data? This removes saved progress and statistics and cannot be undone.")) return;
    store.current?.clear(TIMED_SESSION_KEY);
    store.current?.clear(INFINITE_SESSION_KEY);
    store.current?.clear(STATISTICS_SESSION_KEY);
    store.current?.clear(LEARN_SESSION_KEY);
    setActive(undefined);
    setTimedController(undefined);
    setInfiniteController(undefined);
    setReportStats({});
    navigate("/home", { replace: true });
  };

  const toggleReportSort = (column: ReportSort): void => {
    if (column === reportSort) setReportAscending((ascending) => !ascending);
    else {
      setReportSort(column);
      setReportAscending(true);
    }
  };

  const next = (): void => {
    if (!active) return;
    const { controller, timed } = active;
    controller.next();
    if (controller.isComplete) {
      setScore(timed ? (controller as TimedQuizController).score : 0);
      refreshStats();
      navigate("/results", { replace: true });
      return;
    }
    refreshStats();
    refresh((value) => value + 1);
    navigate(`/${modePath(timed)}/${controller.questionNumber}`, { replace: true });
  };

  const goBack = (): void => {
    active?.controller.pause();
    navigate("/home", { replace: true });
  };

  const pause = (): void => {
    if (active?.timed) active.controller.pause();
    navigate("/home", { replace: true });
  };

  useEffect(() => {
    const saveBeforeLeaving = (): void => active?.controller.pause();
    window.addEventListener("pagehide", saveBeforeLeaving);
    document.addEventListener("visibilitychange", saveBeforeLeaving);
    return () => {
      window.removeEventListener("pagehide", saveBeforeLeaving);
      document.removeEventListener("visibilitychange", saveBeforeLeaving);
    };
  }, [active]);

  const quizRoute = (mode: QuizMode): JSX.Element => {
    const matchesActiveMode = active && active.timed === (mode === "timed");
    return matchesActiveMode
      ? <QuizView controller={active.controller} timed={active.timed} onBack={goBack} onPause={active.timed ? pause : undefined} onRestart={restart} onNext={next} />
      : <Navigate to="/home" replace />;
  };

  const resultsRoute = (): JSX.Element => {
    const controller = active?.controller;
    const timed = active?.timed ?? false;
    const wrongQuestions = timed ? (controller as TimedQuizController | undefined)?.wrongQuestions ?? [] : (controller as InfiniteQuizController | undefined)?.wrongQuestions ?? [];
    const total = controller?.totalQuestions ?? 0;
    const scaledScore = timed ? (controller as TimedQuizController).scaledScore : scoring.scaledScore(score, total);
    const unscoredCount = timed ? (controller as TimedQuizController).unscoredQuestionCount : 0;
    return controller
      ? <ResultsView score={score} total={total} scaledScore={scaledScore} maximumScore={scoring.maximumScore} passingScore={scoring.passingScore} unscoredCount={unscoredCount} wrongQuestions={wrongQuestions} questionNumbers={problems.map(problem => problem.questionNumber)} onBack={() => navigate("/home", { replace: true })} />
      : <Navigate to="/home" replace />;
  };


  if (questionDatabaseError) return <main className="app"><section className="card"><p className="feedback error">{questionDatabaseError}</p></section></main>;
  if (!questionDatabase || !hydrated) return <main className="app"><section className="card"><p>Loading questions...</p></section></main>;

  const openView = (path: string): void => {
    active?.controller.pause();
    navigate(path);
  };

  return <Routes>
    <Route path="/" element={<Navigate to="/home" replace />} />
    <Route path="/home" element={<HomeView questionCount={problems.length} onLearn={() => openView("/learn")} onInfinite={() => resume(false)} onTimed={() => resume(true)} onReports={() => openView("/reports")} onClearBrowserData={clearBrowserData} />} />
    <Route path="/learn" element={<LearnView problems={problems} questionHash={questionDatabase.hash} onBack={goBack} />} />
    <Route path="/infinite/:questionNumber?" element={quizRoute("infinite")} />
    <Route path="/timed/:questionNumber?" element={quizRoute("timed")} />
    <Route path="/results" element={resultsRoute()} />
    <Route path="/reports" element={<ReportView problems={problems} domains={domains} stats={reportStats} sort={reportSort} ascending={reportAscending} onSort={toggleReportSort} onClear={clearStatistics} onExport={exportStatistics} onImport={importStatistics} onBack={() => navigate("/home", { replace: true })} />} />
    <Route path="/reports/:questionNumber" element={<ReportDetailView problems={problems} domains={domains} onBack={() => navigate("/reports")} />} />
    <Route path="*" element={<Navigate to="/home" replace />} />
  </Routes>;
}
