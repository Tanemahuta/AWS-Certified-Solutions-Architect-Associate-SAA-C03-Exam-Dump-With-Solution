import type { ChangeEvent, JSX } from "react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Problem } from "../model/Problem";
import { formatLastFailureAt, groupReportRows, reportRows, sortReportRows } from "./reportRows";
import type { ReportSort } from "./reportRows";
import type { AnswerStatisticsData } from "../persistence/AnswerStatistics";

interface ReportViewProps {
  problems: readonly Problem[];
  domains: readonly string[];
  stats: AnswerStatisticsData;
  sort: ReportSort;
  ascending: boolean;
  onSort: (column: ReportSort) => void;
  onClear: () => void;
  onExport: () => void;
  onImport: (data: unknown) => void;
  onBack: () => void;
}

export function ReportView({ problems, domains, stats, sort, ascending, onSort, onClear, onExport, onImport, onBack }: ReportViewProps): JSX.Element {
  const groups = groupReportRows(sortReportRows(reportRows(problems, domains, stats), sort, ascending));
  const label = (column: ReportSort): string => sort === column ? (ascending ? " ▲" : " ▼") : "";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importFeedback, setImportFeedback] = useState<{ type: "success" | "error"; message: string }>();

  const handleImportClick = (): void => fileInputRef.current?.click();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (): void => {
      try {
        onImport(JSON.parse(String(reader.result)));
        setImportFeedback({ type: "success", message: "Statistics imported." });
      } catch {
        setImportFeedback({ type: "error", message: "Could not import statistics: the file is not valid." });
      }
    };
    reader.onerror = (): void => setImportFeedback({ type: "error", message: "Could not read the selected file." });
    reader.readAsText(file);
  };

  return <main className="app"><section className="card"><header><h1>Question report</h1><div className="actions"><button onClick={onExport}>Export statistics</button><button onClick={handleImportClick}>Import statistics</button><input ref={fileInputRef} type="file" accept="application/json" hidden onChange={handleFileChange} /><button onClick={onClear}>Clear statistics</button><button onClick={onBack}>Back</button></div></header>{importFeedback && <p className={`feedback ${importFeedback.type}`}>{importFeedback.message}</p>}{groups.map((group) => <section className="report-domain" key={group.domain}><h2>{group.domain}</h2><table className="report-table"><thead><tr><th><button onClick={() => onSort("question")}>Question{label("question")}</button></th><th>Title</th><th><button onClick={() => onSort("failureRate")}>Failure ratio{label("failureRate")}</button></th><th><button onClick={() => onSort("answered")}>Answered{label("answered")}</button></th><th><button onClick={() => onSort("lastFailure")}>Last faulty answer{label("lastFailure")}</button></th></tr></thead><tbody>{group.rows.map(({ problem, index, encountered, failureRate, lastFailureAt }) => <tr key={index}><td><Link className="question-link" to={`/reports/${index + 1}`}>{problem.questionNumber}</Link></td><td><Link className="question-link" to={`/reports/${index + 1}`}>{problem.question.slice(0, 64)}{problem.question.length > 64 ? "..." : ""}</Link></td><td>{Math.round(failureRate * 100)}%</td><td>{encountered}</td><td>{formatLastFailureAt(lastFailureAt)}</td></tr>)}</tbody></table></section>)}{groups.length === 0 && <p>No answered questions yet.</p>}</section></main>;
}
