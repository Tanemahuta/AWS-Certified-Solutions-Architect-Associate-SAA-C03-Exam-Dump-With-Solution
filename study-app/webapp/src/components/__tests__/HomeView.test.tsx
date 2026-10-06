import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HomeView } from "../HomeView";

it("makes learning the first action and shows the available question count", async () => {
  const onLearn = jest.fn();
  render(<HomeView questionCount={42} onLearn={onLearn} />);
  expect(screen.getByText(/42 questions/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Learn mode" }));
  expect(onLearn).toHaveBeenCalledTimes(1);
});
