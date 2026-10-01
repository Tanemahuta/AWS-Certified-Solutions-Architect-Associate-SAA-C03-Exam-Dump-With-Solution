import type { Problem } from "../model/Problem";
import type { AnswerStatisticsData } from "../persistence/AnswerStatistics";

export type ReportSort = "question" | "failureRate" | "answered" | "lastFailure";

export interface ReportRow {
  readonly problem: Problem;
  readonly index: number;
  readonly domain: string;
  readonly encountered: number;
  readonly failureRate: number;
  readonly lastFailureAt?: number;
}

export interface ReportDomainGroup {
  readonly domain: string;
  readonly rows: readonly ReportRow[];
}

export function formatLastFailureAt(lastFailureAt?: number): string {
  return lastFailureAt === undefined ? "-" : new Date(lastFailureAt).toISOString().slice(0, 16);
}

export function reportRows(problems: readonly Problem[], domains: readonly string[], stats: AnswerStatisticsData): ReportRow[] {
  return problems
    .flatMap((problem, index) => {
      const stat = stats[index];
      if (!stat?.encountered) return [];
      return [{
        problem,
        index,
        domain: domains[index] ?? "Unknown",
        encountered: stat.encountered,
        failureRate: stat.failures / stat.encountered,
        lastFailureAt: stat.lastFailureAt,
      }];
    });
}

export function sortReportRows(rows: readonly ReportRow[], sort: ReportSort, ascending: boolean): ReportRow[] {
  return [...rows].sort((left, right) => {
    const values: Record<ReportSort, number> = {
      question: left.problem.questionNumber - right.problem.questionNumber,
      failureRate: left.failureRate - right.failureRate,
      answered: left.encountered - right.encountered,
      lastFailure: (left.lastFailureAt ?? 0) - (right.lastFailureAt ?? 0),
    };
    return values[sort] * (ascending ? 1 : -1);
  });
}

export function groupReportRows(rows: readonly ReportRow[]): ReportDomainGroup[] {
  const groups = new Map<string, ReportRow[]>();
  rows.forEach((row) => {
    const group = groups.get(row.domain) ?? [];
    group.push(row);
    groups.set(row.domain, group);
  });
  return [...groups.entries()].map(([domain, groupedRows]) => ({ domain, rows: groupedRows }));
}
