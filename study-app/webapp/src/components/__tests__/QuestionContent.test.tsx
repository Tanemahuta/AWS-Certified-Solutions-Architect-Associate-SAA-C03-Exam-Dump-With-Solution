import { render, screen } from "@testing-library/react";
import { QuestionHeading, ChoiceList } from "../QuestionContent";
import { mockProblem } from "../../test-support/mockProblem";

it("preserves multiline code as inert text in questions and explanations", () => {
  const code = 'const value = 1;\n<script>alert("unsafe")</script>';
  const { container } = render(<><QuestionHeading problem={mockProblem({ question: `Example\n<code>${code}</code>` })} /><ChoiceList choices={[{ solution: "Right", correct: true, explanation: `<code>${code}</code>` }]} /></>);
  const blocks = container.querySelectorAll("code");
  expect(blocks).toHaveLength(2);
  expect(blocks[0].textContent).toBe(code);
  expect(blocks[1].textContent).toBe(code);
  expect(container.querySelector("script")).toBeNull();
  expect(screen.getByText("Right").closest(".report-answer")).toHaveClass("correct");
});
