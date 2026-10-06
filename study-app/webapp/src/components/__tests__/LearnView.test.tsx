import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { LearnEntry, LearnView, LEARN_SESSION_KEY } from "../LearnView";
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
function Location(): React.JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  return <><output aria-label="Current route">{location.pathname}</output><button onClick={() => navigate(-1)}>Browser back</button><button onClick={() => navigate(1)}>Browser forward</button></>;
}
const view = (path = "/learn", items = problems) => <MemoryRouter initialEntries={[path]}><Location /><Routes>
  <Route path="/learn" element={<LearnEntry problems={items} questionHash="hash" onBack={jest.fn()} />} />
  <Route path="/learn/:questionNumber" element={<LearnView problems={items} questionHash="hash" onBack={jest.fn()} />} />
</Routes></MemoryRouter>;

it("reveals multiple correct answers and green explanations without submitting", () => {
  render(view());
  expect(screen.getByText("Learn mode · Question 10 · 1 of 2")).toBeInTheDocument();
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

it("opens a bounded number dialog and jumps only after OK", async () => {
  render(view());
  await userEvent.click(screen.getByRole("button", { name: "Go to" }));
  expect(screen.getByRole("dialog", { name: "Go to question" })).toBeInTheDocument();
  const input = screen.getByRole("spinbutton");
  expect(input).toHaveAttribute("min", "1");
  expect(input).toHaveAttribute("max", "2");
  await userEvent.clear(input);
  await userEvent.type(input, "2");
  expect(screen.getByRole("heading", { name: "First question" })).toBeInTheDocument();
  await userEvent.keyboard("{ArrowLeft}");
  await userEvent.click(screen.getByRole("button", { name: "OK" }));
  expect(screen.getByRole("heading")).toHaveTextContent("Second question");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("cancels the dialog without changing learning position", async () => {
  render(view());
  await userEvent.click(screen.getByRole("button", { name: "Go to" }));
  fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "2" } });
  expect(screen.getByRole("spinbutton")).toHaveValue(2);
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.getByRole("heading")).toHaveTextContent("First question");
});

it("scrolls back to the top after moving to a different question", async () => {
  render(view());
  jest.mocked(window.scrollTo).mockClear();
  await userEvent.click(screen.getByRole("button", { name: "Next question" }));
  expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "instant" });
});

function pointer(target: Element, type: string, x: number, y: number, pointerType = "touch"): void {
  const event = new Event(type, { bubbles: true });
  Object.assign(event, { clientX: x, clientY: y, pointerType, pointerId: 1, isPrimary: true });
  fireEvent(target, event);
}

it("navigates with horizontal touch swipes, respecting question boundaries", () => {
  const { container } = render(view());
  const page = container.querySelector("main")!;
  pointer(page, "pointerdown", 250, 200);
  pointer(page, "pointerup", 50, 205);
  expect(screen.getByRole("heading")).toHaveTextContent("Second question");
  pointer(page, "pointerdown", 250, 200);
  pointer(page, "pointerup", 50, 205);
  expect(screen.getByRole("heading")).toHaveTextContent("Second question");
  pointer(page, "pointerdown", 50, 200);
  pointer(page, "pointerup", 250, 205);
  expect(screen.getByRole("heading")).toHaveTextContent("First question");
});

it("ignores vertical scrolling, mouse dragging, and swipes starting on controls", () => {
  const { container } = render(view());
  const page = container.querySelector("main")!;
  pointer(page, "pointerdown", 250, 200);
  pointer(page, "pointerup", 170, 400);
  pointer(page, "pointerdown", 250, 200, "mouse");
  pointer(page, "pointerup", 50, 200, "mouse");
  const control = screen.getByRole("button", { name: "Go to" });
  pointer(control, "pointerdown", 250, 200);
  pointer(control, "pointerup", 50, 200);
  expect(screen.getByRole("heading")).toHaveTextContent("First question");
});

it("handles an empty question database without navigation or invalid saved progress", () => {
  render(view("/learn", []));
  expect(screen.getByText("No questions available.")).toBeInTheDocument();
  expect(localStorage.getItem(LEARN_SESSION_KEY)).toBeNull();
  expect(screen.queryByRole("button", { name: "Next question" })).not.toBeInTheDocument();
});

 it("redirects the entry route to the saved question and honors direct links", () => {
  localStorage.setItem(LEARN_SESSION_KEY, JSON.stringify({ questionHash: "hash", questionNumber: 20 }));
  const { unmount } = render(view());
  expect(screen.getByLabelText("Current route")).toHaveTextContent("/learn/20");
  unmount();
  render(view("/learn/10"));
  expect(screen.getByRole("heading")).toHaveTextContent("First question");
});

it("updates the question URL and supports browser back and forward", async () => {
  render(view());
  expect(screen.getByLabelText("Current route")).toHaveTextContent("/learn/10");
  await userEvent.click(screen.getByRole("button", { name: "Next question" }));
  expect(screen.getByLabelText("Current route")).toHaveTextContent("/learn/20");
  await userEvent.click(screen.getByRole("button", { name: "Browser back" }));
  expect(screen.getByRole("heading")).toHaveTextContent("First question");
  await userEvent.click(screen.getByRole("button", { name: "Browser forward" }));
  expect(screen.getByRole("heading")).toHaveTextContent("Second question");
});

it.each(["/learn/0", "/learn/999", "/learn/abc", "/learn/10.5"])("redirects an invalid route %s to the saved or first question", path => {
  render(view(path));
  expect(screen.getByLabelText("Current route")).toHaveTextContent("/learn/10");
});
