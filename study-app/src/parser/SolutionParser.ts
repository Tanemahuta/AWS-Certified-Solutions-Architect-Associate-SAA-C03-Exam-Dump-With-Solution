import { SectionParser } from "./SectionParser.js";
import type { Solution } from "./Solution.js";
import { AnnotatedChoiceStrategy, AnswerStrategyPipeline, DeclaredAnswerStrategy, ExplicitCombinationStrategy, MatchedAnswerLineStrategy } from "./AnswerStrategy.js";

export class SolutionParser {
  public constructor(
    private readonly sections: SectionParser,
    private readonly answerStart: RegExp,
    private readonly answerLetters: RegExp,
    private readonly answers = new AnswerStrategyPipeline([
      new DeclaredAnswerStrategy(),
      new ExplicitCombinationStrategy(),
      new MatchedAnswerLineStrategy(),
      new AnnotatedChoiceStrategy(),
    ]),
  ) {}

  public parse(text: string): Map<number, Solution> {
    return new Map(this.sections.parse(text).map(({ number, lines }) => {
      const answerLineIndex = [
        lines.findIndex((line) => /^\s*[A-H](?:\s*(?:,|and|&)\s*[A-H])+\s*$/i.test(line)),
        lines.findIndex((line) => /^ans-\s*/i.test(line)),
        lines.findIndex((line) => this.answerLetters.test(line)),
        lines.findIndex((line) => this.answerStart.test(line)),
      ].find((index) => index >= 0) ?? -1;
      const match = answerLineIndex < 0 ? undefined : lines[answerLineIndex].match(this.answerLetters);
      const parsed = this.answers.parse({
        lines,
        answerLineIndex,
        answerLine: match?.[2],
        answerLetters: match?.[1].match(/[A-H]/gi)?.map((letter) => letter.toUpperCase()) ?? [],
      });
      return [number, parsed];
    }));
  }
}
