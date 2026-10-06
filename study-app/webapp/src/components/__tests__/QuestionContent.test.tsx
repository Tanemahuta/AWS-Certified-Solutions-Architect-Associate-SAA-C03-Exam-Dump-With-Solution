import { render, screen } from "@testing-library/react";
import { QuestionHeading, QuestionText, ChoiceList } from "../QuestionContent";
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

it("uses the explicit code language and preserves source text while highlighting", () => {
  const source = '{\n  "Effect": "Allow",\n  "Action": "s3:GetObject"\n}';
  const { container } = render(<QuestionText text={`<code class="language-json">${source}</code>`} />);
  const block = screen.getByLabelText("json code");
  expect(block).toHaveClass("language-json");
  expect(block.textContent).toBe(source);
  expect(container.querySelector(".hljs-attr")).toBeInTheDocument();
});

it("detects an unlabelled code block's language", () => {
  render(<QuestionText text={'<code>const value = true;\nconsole.log(value);</code>'} />);
  expect(screen.getByLabelText("javascript code")).toHaveClass("language-javascript");
});

it("falls back to inert plaintext for unsupported languages", () => {
  const source = '<img src=x onerror="alert(1)">\n<script>alert(1)</script>';
  const { container } = render(<QuestionText text={`<code class="language-unknown">${source}</code>`} />);
  expect(screen.getByLabelText("plaintext code").textContent).toBe(source);
  expect(container.querySelector("img, script")).toBeNull();
});

it("renders paragraphs and line breaks while keeping unrecognized HTML inert", () => {
  const { container } = render(<QuestionText text={'<p>Scenario<br/>More detail</p><p>Which answer?</p><p><img src=x onerror=alert(1)></p><code><p>literal code</p>\nnext line</code>'} />);
  expect(container.querySelectorAll("p")).toHaveLength(3);
  expect(container.querySelectorAll("br")).toHaveLength(1);
  expect(container.querySelector("img")).toBeNull();
  expect(container.querySelector("code")).toHaveTextContent("<p>literal code</p>");
  expect(container.querySelector("code")?.textContent).toContain("\nnext line");
});
