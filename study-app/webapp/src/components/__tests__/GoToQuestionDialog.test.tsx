import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GoToQuestionDialog } from "../GoToQuestionDialog";

it("validates whole numbers within the question count", async () => {
  const onGo = jest.fn();
  render(<GoToQuestionDialog current={3} total={10} onGo={onGo} onClose={jest.fn()} />);
  const input = screen.getByRole("spinbutton");
  for (const value of ["", "0", "11", "2.5"]) {
    fireEvent.change(input, { target: { value } });
    expect(screen.getByRole("button", { name: "OK" })).toBeDisabled();
  }
  fireEvent.change(input, { target: { value: "10" } });
  await userEvent.click(screen.getByRole("button", { name: "OK" }));
  expect(onGo).toHaveBeenCalledWith(10);
});

it("uses native spinner bounds and handles Escape cancellation", async () => {
  const onClose = jest.fn();
  render(<GoToQuestionDialog current={1} total={2} onGo={jest.fn()} onClose={onClose} />);
  expect(screen.getByRole("spinbutton")).toHaveAttribute("min", "1");
  expect(screen.getByRole("spinbutton")).toHaveAttribute("max", "2");
  fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "2" } });
  expect(screen.getByRole("spinbutton")).toHaveValue(2);
  expect(screen.getAllByRole("button")).toHaveLength(2);
  fireEvent(screen.getByRole("dialog"), new Event("cancel", { bubbles: false, cancelable: true }));
  expect(onClose).toHaveBeenCalledTimes(1);
});
