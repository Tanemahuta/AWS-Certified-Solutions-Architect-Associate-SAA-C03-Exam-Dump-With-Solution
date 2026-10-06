import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { App } from "../App";
import { loadQuestionDatabase } from "../persistence/QuestionDatabaseLoader";
import { LEARN_SESSION_KEY } from "../components/LearnView";
import { mockProblem } from "../test-support/mockProblem";

jest.mock("../debug", () => ({ debug: jest.fn() }));
jest.mock("../persistence/QuestionDatabaseLoader", () => ({ loadQuestionDatabase: jest.fn() }));
const problems = [mockProblem({ questionNumber: 10, question: "Learn the first question" }), mockProblem({ questionNumber: 30, question: "Learn the second question" })];

beforeEach(() => {
  localStorage.clear();
  jest.mocked(loadQuestionDatabase).mockResolvedValue({ hash: "hash", domains: { Security: problems } });
});
afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });
const renderApp = (path = "/home") => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);

async function homeEntry(entry: string): Promise<void> {
  const home = screen.queryByRole("button", { name: "Home" });
  if (home) await userEvent.click(home);
  await userEvent.click(screen.getByRole("button", { name: entry }));
}

it("resumes learning across home navigation without recording test answers", async () => {
  renderApp();
  await userEvent.click(await screen.findByRole("button", { name: "Learn mode" }));
  await userEvent.click(screen.getByRole("button", { name: "Next question" }));
  await userEvent.click(screen.getByRole("button", { name: "Home" }));
  await userEvent.click(screen.getByRole("button", { name: "Learn mode" }));
  expect(screen.getByRole("heading")).toHaveTextContent("Learn the second question");
  await homeEntry("Statistics");
  expect(screen.getByText("No answered questions yet.")).toBeInTheDocument();
});

it("clears learning progress only after confirmation", async () => {
  const confirm = jest.spyOn(window, "confirm").mockReturnValue(false);
  renderApp("/learn");
  await screen.findByRole("heading", { name: "Learn the first question" });
  await userEvent.click(screen.getByRole("button", { name: "Next question" }));
  await homeEntry("Clear all browser data");
  expect(JSON.parse(localStorage.getItem(LEARN_SESSION_KEY)!).questionNumber).toBe(30);
  confirm.mockReturnValue(true);
  await homeEntry("Clear all browser data");
  expect(localStorage.getItem(LEARN_SESSION_KEY)).toBeNull();
  await userEvent.click(screen.getByRole("button", { name: "Learn mode" }));
  expect(screen.getByRole("heading")).toHaveTextContent("Learn the first question");
});

it("opens the renamed all-questions test from the home buttons", async () => {
  renderApp();
  await screen.findByRole("button", { name: "Learn mode" });
  await homeEntry("Test all questions");
  expect(screen.getByRole("button", { name: /Submit answer/ })).toBeDisabled();
  expect(screen.getByText(/Question (10|30) · 1 of 2/)).toBeInTheDocument();
});

 it("pauses the timed test in place and resumes the countdown with the play toggle", async () => {
  jest.useFakeTimers();
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  await act(async () => { renderApp(); });
  await user.click(screen.getByRole("button", { name: "Timed test" }));
  const timer = document.querySelector(".timer")!;
  const initial = timer.textContent;
  await user.click(screen.getByRole("button", { name: "Pause test" }));
  expect(screen.getByRole("button", { name: "Resume test" })).toHaveTextContent("");
  expect(screen.getByRole("status")).toHaveTextContent("Test paused");
  expect(screen.getByRole("button", { name: /Submit answer/ })).toBeDisabled();
  act(() => jest.advanceTimersByTime(5000));
  expect(timer.textContent).toBe(initial);
  await user.keyboard("1n");
  expect(screen.getByRole("button", { name: /Submit answer/ })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Resume test" }));
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  act(() => jest.advanceTimersByTime(1000));
  expect(timer.textContent).not.toBe(initial);
  expect(screen.getByRole("button", { name: "Pause test" })).toBeInTheDocument();
});
