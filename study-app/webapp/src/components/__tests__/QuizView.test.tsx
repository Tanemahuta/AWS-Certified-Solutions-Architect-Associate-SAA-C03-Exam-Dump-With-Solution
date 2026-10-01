import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockProblem } from "../../test-support/mockProblem";
import { startedInfiniteController } from "../../test-support/mockQuizController";
import { QuizView } from "../QuizView";

const problems = [
  mockProblem({ questionNumber: 1, question: "Pick the right one", choices: [{ solution: "Wrong", explanation: "Nope." }, { solution: "Right", correct: true, explanation: "Yes." }] }),
  mockProblem({ questionNumber: 2, question: "Pick two", choices: [{ solution: "One", correct: true }, { solution: "Two", correct: true }, { solution: "Three" }] }),
];

function renderQuiz() {
  const controller = startedInfiniteController(problems);
  const handlers = { onBack: jest.fn(), onRestart: jest.fn(), onNext: jest.fn(() => controller.next()) };
  render(<QuizView controller={controller} timed={false} {...handlers} />);
  return { controller, ...handlers };
}

describe("QuizView", () => {
  it("only enables submitting after a selection", async () => {
    renderQuiz();
    const submit = screen.getByRole("button", { name: /Submit answer/ });
    expect(submit).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: /Wrong/ }));
    expect(submit).toBeEnabled();
  });

  it("reveals the result and explanations of a wrong answer", async () => {
    const { onNext } = renderQuiz();
    await userEvent.click(screen.getByRole("button", { name: /Wrong/ }));
    await userEvent.click(screen.getByRole("button", { name: /Submit answer/ }));

    expect(screen.getByText("Incorrect.")).toBeInTheDocument();
    expect(screen.getByText("Nope.")).toBeInTheDocument();
    expect(screen.getByText("Yes.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Right/ })).toHaveClass("correct");
    expect(onNext).not.toHaveBeenCalled();
    expect(screen.getByText(/1 answered \(1 incorrect\)/)).toBeInTheDocument();
  });

  it("supports keyboard shortcuts and advances immediately on a correct answer", async () => {
    const { controller, onNext } = renderQuiz();
    const rightIndex = controller.currentChoices.findIndex((choice) => choice.correct);
    await userEvent.keyboard(String(rightIndex + 1));
    await userEvent.keyboard("n");

    expect(onNext).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Pick two")).toBeInTheDocument();
    expect(screen.getByText("Select 2 answers (0 selected)")).toBeInTheDocument();
  });

  it("restarts and goes back via the header buttons", async () => {
    const { onBack, onRestart } = renderQuiz();
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    await userEvent.click(screen.getByRole("button", { name: "Restart" }));
    expect(onBack).toHaveBeenCalled();
    expect(onRestart).toHaveBeenCalled();
  });
});
