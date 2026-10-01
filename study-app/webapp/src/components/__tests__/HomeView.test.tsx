import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HomeView } from "../HomeView";

describe("HomeView", () => {
  it("shows the question count and wires every menu button", async () => {
    const handlers = { onInfinite: jest.fn(), onTimed: jest.fn(), onReports: jest.fn(), onClearBrowserData: jest.fn() };
    render(<HomeView questionCount={42} {...handlers} />);

    expect(screen.getByText(/42 questions/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Infinite test" }));
    await userEvent.click(screen.getByRole("button", { name: "Timed test" }));
    await userEvent.click(screen.getByRole("button", { name: "Reports" }));
    await userEvent.click(screen.getByRole("button", { name: "Clear browser data" }));

    Object.values(handlers).forEach((handler) => expect(handler).toHaveBeenCalledTimes(1));
  });
});
