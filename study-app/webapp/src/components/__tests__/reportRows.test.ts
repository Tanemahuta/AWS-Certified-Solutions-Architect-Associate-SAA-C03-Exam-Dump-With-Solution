import { formatLastFailureAt, groupReportRows, reportRows, sortReportRows } from "../reportRows";
import { mockProblem } from "../../test-support/mockProblem";
import type { AnswerStatisticsData } from "../../persistence/AnswerStatistics";

describe("ReportView helpers", () => {
  const problems = [
    mockProblem({ questionNumber: 1, question: "Secure question" }),
    mockProblem({ questionNumber: 2, question: "Resilient question" }),
    mockProblem({ questionNumber: 3, question: "Another secure question" }),
  ];
  const domains = ["Security", "Resilience", "Security"];
  const stats: AnswerStatisticsData = {
    0: { encountered: 3, failures: 1, lastFailureAt: 1_000 },
    1: { encountered: 2, failures: 2, lastFailureAt: 3_000 },
    2: { encountered: 1, failures: 0 },
  };

  it("builds report rows with last faulty answer timestamps", () => {
    expect(reportRows(problems, domains, stats)).toMatchObject([
      { index: 0, domain: "Security", encountered: 3, failureRate: 1 / 3, lastFailureAt: 1_000 },
      { index: 1, domain: "Resilience", encountered: 2, failureRate: 1, lastFailureAt: 3_000 },
      { index: 2, domain: "Security", encountered: 1, failureRate: 0 },
    ]);
  });

  it("groups report rows by domain", () => {
    const groups = groupReportRows(reportRows(problems, domains, stats));

    expect(groups.map((group) => ({ domain: group.domain, questions: group.rows.map((row) => row.problem.questionNumber) }))).toEqual([
      { domain: "Security", questions: [1, 3] },
      { domain: "Resilience", questions: [2] },
    ]);
  });

  it("sorts rows by last faulty answer timestamp", () => {
    const rows = reportRows(problems, domains, stats);

    expect(sortReportRows(rows, "lastFailure", true).map((row) => row.problem.questionNumber)).toEqual([3, 1, 2]);
    expect(sortReportRows(rows, "lastFailure", false).map((row) => row.problem.questionNumber)).toEqual([2, 1, 3]);
  });

  it("formats last faulty answer timestamps as ISO8601 minutes", () => {
    expect(formatLastFailureAt(Date.UTC(2026, 8, 9, 10, 44, 38))).toBe("2026-09-09T10:44");
    expect(formatLastFailureAt()).toBe("-");
  });
});
