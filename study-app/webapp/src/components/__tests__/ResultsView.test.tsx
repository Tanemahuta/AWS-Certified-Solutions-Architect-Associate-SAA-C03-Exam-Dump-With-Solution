import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ResultsView } from "../ResultsView";

function renderResults(scaledScore: number, wrongQuestions: number[] = [], onBack = jest.fn()): void {
  render(<MemoryRouter><ResultsView score={50} total={65} scaledScore={scaledScore} maximumScore={1000} passingScore={720} unscoredCount={15} wrongQuestions={wrongQuestions} onBack={onBack} /></MemoryRouter>);
}

describe("ResultsView", () => {
  it("reports a passed exam", () => {
    renderResults(800);
    expect(screen.getByText("Score: 800 / 1000 (50 correct, 15 unscored of 65 questions)")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Passed (720 required)" })).toBeInTheDocument();
    expect(screen.queryByText("Questions to review")).not.toBeInTheDocument();
  });

  it("reports a failed exam and links wrong questions to their report", () => {
    renderResults(600, [0, 4]);
    expect(screen.getByRole("heading", { name: "Not passed (720 required)" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Question 1" })).toHaveAttribute("href", "/reports/1");
    expect(screen.getByRole("link", { name: "Question 5" })).toHaveAttribute("href", "/reports/5");
  });

  it("navigates back to the menu", async () => {
    const onBack = jest.fn();
    renderResults(800, [], onBack);
    await userEvent.click(screen.getByRole("button", { name: "Back to menu" }));
    expect(onBack).toHaveBeenCalled();
  });
});
