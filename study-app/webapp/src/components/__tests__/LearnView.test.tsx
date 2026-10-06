import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LearnView, LEARN_SESSION_KEY } from "../LearnView";
import { mockProblem } from "../../test-support/mockProblem";

const problems = [
  mockProblem({ questionNumber: 10, question: "First question", choices: [
    { solution: "Wrong", explanation: "Wrong explanation" },
    { solution: "Correct", correct: true, explanation: "Correct explanation" },
    { solution: "Also correct", correct: true, explanation: "Second explanation" },
  ] }),
  mockProblem({ questionNumber: 20, question: "Second question" }),
];
beforeEach(() => localStorage.clear());
const view = () => <LearnView problems={problems} questionHash="hash" onBack={jest.fn()} />;

it("reveals multiple correct answers and green explanations without submitting", () => {
  render(view());
  expect(screen.getByText("Question 10", { selector: "p" })).toBeInTheDocument();
  expect(screen.getByText("Correct").closest(".report-answer")).toHaveClass("correct");
  expect(screen.getByText("Also correct").closest(".report-answer")).toHaveClass("correct");
  expect(screen.getByText("Correct explanation").closest(".choice-explanation")).toHaveClass("explanation-correct");
  expect(screen.queryByText("Wrong explanation")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Submit/ })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Previous question" })).toBeDisabled();
});

it("saves the original question number and restores it after remounting", async () => {
  const { unmount } = render(view());
  await userEvent.click(screen.getByRole("button", { name: "Next question" }));
  expect(screen.getByRole("button", { name: "Next question" })).toBeDisabled();
  expect(JSON.parse(localStorage.getItem(LEARN_SESSION_KEY)!)).toEqual({ questionHash: "hash", questionNumber: 20 });
  unmount();
  render(view());
  expect(screen.getByRole("heading")).toHaveTextContent("Second question");
  await userEvent.click(screen.getByRole("button", { name: "Previous question" }));
  expect(screen.getByRole("heading")).toHaveTextContent("First question");
});

it.each(['{"questionHash":"old","questionNumber":20}', '{"questionHash":"hash","questionNumber":999}', 'invalid'])('starts at the first question for stale or invalid storage: %s', (saved) => {
  localStorage.setItem(LEARN_SESSION_KEY, saved);
  render(view());
  expect(screen.getByRole("heading")).toHaveTextContent("First question");
});

it("supports jumping to a question and does not intercept keys in the selector", async () => {
  render(view());
  await userEvent.selectOptions(screen.getByRole("combobox"), "1");
  expect(screen.getByRole("heading")).toHaveTextContent("Second question");
  await userEvent.keyboard("{ArrowLeft}");
  expect(screen.getByRole("heading")).toHaveTextContent("Second question");
  screen.getByRole("combobox").blur();
  await userEvent.keyboard("{ArrowLeft}");
  expect(screen.getByRole("heading")).toHaveTextContent("First question");
});

it("handles an empty question database without navigation or invalid saved progress", () => {
  render(<LearnView problems={[]} questionHash="hash" onBack={jest.fn()} />);
  expect(screen.getByText("No questions available.")).toBeInTheDocument();
  expect(localStorage.getItem(LEARN_SESSION_KEY)).toBeNull();
  expect(screen.queryByRole("button", { name: "Next question" })).not.toBeInTheDocument();
});
