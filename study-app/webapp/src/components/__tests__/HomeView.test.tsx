import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HomeView } from "../HomeView";

it("makes learning the first action and shows the available question count", async () => {
  const onLearn = jest.fn();
  render(<HomeView questionCount={42} onLearn={onLearn} onInfinite={jest.fn()} onTimed={jest.fn()} onReports={jest.fn()} onClearBrowserData={jest.fn()} />);
  expect(screen.getByText(/42 questions/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Learn mode" }));
  expect(onLearn).toHaveBeenCalledTimes(1);
});

 it("wires the restored navigation buttons", async () => {
  const handlers = { onLearn: jest.fn(), onInfinite: jest.fn(), onTimed: jest.fn(), onReports: jest.fn(), onClearBrowserData: jest.fn() };
  render(<HomeView questionCount={42} {...handlers} />);
  for (const name of ["Learn mode", "Test all questions", "Timed test", "Statistics", "Clear data"]) await userEvent.click(screen.getByRole("button", { name }));
  Object.values(handlers).forEach(handler => expect(handler).toHaveBeenCalledTimes(1));
});
