import { readFile } from "node:fs/promises";
import pdf from "pdf-parse";
import type { Problem } from "./model.js";
import { ChoiceParser } from "./parser/ChoiceParser.js";
import { ProblemBuilder } from "./parser/ProblemBuilder.js";
import { SectionParser } from "./parser/SectionParser.js";
import { SolutionParser } from "./parser/SolutionParser.js";
import { DomainMatcher } from "./parser/DomainMatcher.js";
import { parseQuestionOverrides, type QuestionOverrides } from "./parser/QuestionOverride.js";
import { QuestionOverrideApplier } from "./parser/QuestionOverrideApplier.js";
import { PdfTextPostProcessor } from "./parser/PdfTextPostProcessor.js";
import { renderPdfPage } from "./parser/PdfPageTextRenderer.js";

export class ProblemParser {
  private readonly sections: SectionParser;
  private readonly choices: ChoiceParser;
  private readonly solutions: SolutionParser;
  private readonly builder = new ProblemBuilder();
  private readonly domainMatcher = new DomainMatcher();
  private readonly pdfTextPostProcessor = new PdfTextPostProcessor();

  public constructor(
    private readonly pdfPath: string,
    private readonly solutionPath: string,
    private readonly overridePath?: string,
    private readonly pdfQuestionStart: RegExp = /Topic\s+(\d+)\s*Question\s*#(\d+)\s*(.*)/i,
    private readonly solutionStart: RegExp = /^\s*(?:IMP[^0-9]*)?(\d+)[\].]\s*(.*)$/i,
    private readonly answerStart: RegExp = /^\s*(?:ans-\s*)?([A-H])(?:[.)])\s+(.*)$/i,
    private readonly choiceStart: RegExp = /^\s*([A-H])(?:[.)])(?:\s+(.*))?$/i,
  ) {
    this.sections = new SectionParser(this.pdfQuestionStart, 1, 2, 3);
    this.choices = new ChoiceParser(this.choiceStart, this.pdfQuestionStart);
    this.solutions = new SolutionParser(
      new SectionParser(this.solutionStart),
      this.answerStart,
      /^\s*(?:ans-\s*)?([A-H](?:\s*(?:,|and|&)\s*[A-H])+)\s*[.)]?\s*(.*)$/i,
    );
  }

  public async parse(): Promise<Record<string, Problem[]>> {
    const [pdfBuffer, solutionText, overrides] = await Promise.all([
      readFile(this.pdfPath),
      readFile(this.solutionPath, "utf8").then((text) => this.pdfTextPostProcessor.process(text)),
      this.readOverrides(),
    ]);
    const pdfText = this.pdfTextPostProcessor.process((await pdf(pdfBuffer, { pagerender: renderPdfPage })).text);
    const solutions = this.solutions.parse(solutionText);
    const overrideApplier = new QuestionOverrideApplier(overrides);

    const problems = this.sections.parse(pdfText).flatMap(({ number, lines }) => {
      const firstChoice = this.choices.firstChoiceIndex(lines);
      const question = lines.slice(0, firstChoice).join(" ");
      const parsedChoices = this.choices.parse(lines);
      if (!question.trim() || parsedChoices.length === 0) return [];
      const domain = this.domainMatcher.match(`${question} ${parsedChoices.map((choice) => choice.solution).join(" ")}`, number);
      const problem = overrideApplier.apply(this.builder.build(number, question, parsedChoices, solutions.get(number)));
      return [{ domain, problem }];
    });
    return problems.reduce<Record<string, Problem[]>>((groups, item) => {
      (groups[item.domain] ??= []).push(item.problem);
      return groups;
    }, {});
  }

  private async readOverrides(): Promise<QuestionOverrides> {
    if (!this.overridePath) return {};
    try {
      return parseQuestionOverrides(this.pdfTextPostProcessor.process(await readFile(this.overridePath, "utf8")));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
      throw error;
    }
  }
}
