import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { mockProblem } from "../../test-support/mockProblem";
import { ReportDetailView } from "../ReportDetailView";

const problems = [
  mockProblem({ questionNumber: 1, question: "First question" }),
  mockProblem({
    questionNumber: 2,
    question: "Second question\nwith a second line",
    choices: [{ solution: "Wrong" }, { solution: "Right", correct: true, explanation: "Because it is right." }],
  }),
];

function renderAt(path: string, onBack = jest.fn()): void {
  render(<MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/reports" element={<p>Report overview</p>} />
      <Route path="/reports/:questionNumber" element={<ReportDetailView problems={problems} domains={["Security", "Resilience"]} onBack={onBack} />} />
    </Routes>
  </MemoryRouter>);
}

describe("ReportDetailView", () => {
  it("shows the addressed question with its domain, answers and explanations", () => {
    renderAt("/reports/2");
    expect(screen.getByText("Question 2 · Resilience")).toBeInTheDocument();
    expect(screen.getByRole("heading")).toHaveTextContent("Second questionwith a second line");
    expect(screen.getByText("B. Right")).toHaveClass("correct");
    expect(screen.getByText("A. Wrong")).not.toHaveClass("correct");
    expect(screen.getByText("Because it is right.")).toBeInTheDocument();
  });

  it.each(["/reports/0", "/reports/3", "/reports/abc"])("redirects %s to the report overview", (path) => {
    renderAt(path);
    expect(screen.getByText("Report overview")).toBeInTheDocument();
  });

  it("goes back to the report", async () => {
    const onBack = jest.fn();
    renderAt("/reports/1", onBack);
    await userEvent.click(screen.getByRole("button", { name: "Back to report" }));
    expect(onBack).toHaveBeenCalled();
  });
});
