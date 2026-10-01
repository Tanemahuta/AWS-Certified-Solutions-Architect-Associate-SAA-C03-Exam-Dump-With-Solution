import { render, screen } from "@testing-library/react";
import { ProgressSummary } from "../ProgressSummary";
import { QuizProgressBar } from "../QuizProgressBar";

describe("ProgressSummary", () => {
  it("summarizes answered, incorrect and rounded success rate", () => {
    render(<ProgressSummary answered={7} incorrect={2} successRate={5 / 7} />);
    expect(screen.getByText("7 answered (2 incorrect) · 71% success")).toBeInTheDocument();
  });

  it("appends the remaining questions when given", () => {
    render(<ProgressSummary answered={1} incorrect={0} successRate={1} remaining={9} />);
    expect(screen.getByText(/· 9 remaining$/)).toBeInTheDocument();
  });
});

describe("QuizProgressBar", () => {
  it("renders an accessible progress bar with a visible label", () => {
    render(<QuizProgressBar value={3} max={10} label="3 questions remaining" />);
    const bar = screen.getByLabelText("3 questions remaining");
    expect(bar.querySelector("progress")).toHaveAttribute("value", "3");
    expect(screen.getByText("3 questions remaining")).toBeVisible();
  });

  it("can hide the label text", () => {
    render(<QuizProgressBar value={3} max={10} label="Time remaining" showLabel={false} />);
    expect(screen.queryByText("Time remaining")).not.toBeInTheDocument();
  });
});
