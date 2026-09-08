import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { AnswerStatisticsData } from "../../persistence/AnswerStatistics";
import { mockProblem } from "../../test-support/mockProblem";
import { ReportView } from "../ReportView";
import type { ReportSort } from "../reportRows";

const problems = [
  mockProblem({ questionNumber: 1, question: "Secure question" }),
  mockProblem({ questionNumber: 2, question: "Resilient question" }),
];
const domains = ["Security", "Resilience"];

function renderReport(stats: AnswerStatisticsData, overrides: Partial<{ sort: ReportSort; ascending: boolean; onSort: jest.Mock; onImport: jest.Mock }> = {}) {
  const props = { onSort: jest.fn(), onClear: jest.fn(), onExport: jest.fn(), onImport: jest.fn(), onBack: jest.fn(), sort: "question" as ReportSort, ascending: true, ...overrides };
  render(<MemoryRouter><ReportView problems={problems} domains={domains} stats={stats} {...props} /></MemoryRouter>);
  return props;
}

describe("ReportView", () => {
  it("shows an empty state without answered questions", () => {
    renderReport({});
    expect(screen.getByText("No answered questions yet.")).toBeInTheDocument();
  });

  it("groups answered questions per domain with failure ratio", () => {
    renderReport({ 0: { encountered: 4, failures: 1 }, 1: { encountered: 2, failures: 2, lastFailureAt: Date.UTC(2026, 0, 2, 3, 4) } });

    const security = screen.getByRole("heading", { name: "Security" }).closest("section")!;
    expect(within(security).getByRole("link", { name: "Secure question" })).toHaveAttribute("href", "/reports/1");
    expect(within(security).getByText("25%")).toBeInTheDocument();
    const resilience = screen.getByRole("heading", { name: "Resilience" }).closest("section")!;
    expect(within(resilience).getByText("100%")).toBeInTheDocument();
    expect(within(resilience).getByText("2026-01-02T03:04")).toBeInTheDocument();
  });

  it("marks the active sort column and requests re-sorting", async () => {
    const { onSort } = renderReport({ 0: { encountered: 1, failures: 0 } }, { sort: "failureRate", ascending: false });
    expect(screen.getByRole("button", { name: "Failure ratio ▼" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Answered" }));
    expect(onSort).toHaveBeenCalledWith("answered");
  });

  it("imports a valid statistics file", async () => {
    const { onImport } = renderReport({});
    const input = document.querySelector<HTMLInputElement>("input[type=file]")!;
    await userEvent.upload(input, new File(['{"0":{"encountered":1,"failures":0}}'], "stats.json", { type: "application/json" }));

    expect(await screen.findByText("Statistics imported.")).toBeInTheDocument();
    expect(onImport).toHaveBeenCalledWith({ 0: { encountered: 1, failures: 0 } });
  });

  it("reports an invalid statistics file", async () => {
    const { onImport } = renderReport({});
    const input = document.querySelector<HTMLInputElement>("input[type=file]")!;
    await userEvent.upload(input, new File(["not json"], "stats.json", { type: "application/json" }));

    expect(await screen.findByText("Could not import statistics: the file is not valid.")).toBeInTheDocument();
    expect(onImport).not.toHaveBeenCalled();
  });
});
