import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppMenu } from "../AppMenu";

const handlers = () => ({ onHome: jest.fn(), onLearn: jest.fn(), onInfinite: jest.fn(), onTimed: jest.fn(), onReports: jest.fn(), onClearData: jest.fn() });

it("opens an accessible navigation overlay with learning first", async () => {
  const props = handlers();
  render(<AppMenu {...props} />);
  const menu = screen.getByRole("button", { name: "Menu" });
  expect(menu).toHaveAttribute("aria-expanded", "false");
  await userEvent.click(menu);
  const nav = screen.getByRole("navigation", { name: "App navigation" });
  expect(within(nav).getAllByRole("button")[0]).toHaveTextContent("Learn mode");
  await userEvent.click(screen.getByRole("button", { name: "Learn mode" }));
  expect(props.onLearn).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
});

it("groups test and report entries and wires their actions", async () => {
  const props = handlers();
  render(<AppMenu {...props} />);
  for (const [group, label, handler] of [
    ["Tests", "Test all questions", props.onInfinite], ["Tests", "Timed test", props.onTimed],
    ["Reports", "Statistics", props.onReports], ["Reports", "Clear data", props.onClearData],
  ] as const) {
    await userEvent.click(screen.getByRole("button", { name: "Menu" }));
    await userEvent.click(screen.getByText(group));
    await userEvent.click(screen.getByRole("button", { name: label }));
    expect(handler).toHaveBeenCalledTimes(1);
  }
});

it("closes on Escape with focus restored, or an outside pointer click", async () => {
  render(<><AppMenu {...handlers()} /><p>Outside</p></>);
  const menu = screen.getByRole("button", { name: "Menu" });
  await userEvent.click(menu);
  await userEvent.keyboard("{Escape}");
  expect(menu).toHaveFocus();
  expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  await userEvent.click(menu);
  await userEvent.click(screen.getByText("Outside"));
  expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
});

it("keeps pause and restart in the Tests submenu when a test is active", async () => {
  const onPause = jest.fn();
  const onRestart = jest.fn();
  render(<AppMenu {...handlers()} onPause={onPause} onRestart={onRestart} />);
  await userEvent.click(screen.getByRole("button", { name: "Menu" }));
  await userEvent.click(screen.getByText("Tests"));
  await userEvent.click(screen.getByRole("button", { name: "Pause test" }));
  expect(onPause).toHaveBeenCalledTimes(1);
  await userEvent.click(screen.getByRole("button", { name: "Menu" }));
  await userEvent.click(screen.getByText("Tests"));
  await userEvent.click(screen.getByRole("button", { name: "Restart test" }));
  expect(onRestart).toHaveBeenCalledTimes(1);
});
