import type { Choice } from "../model.js";
import { normalize } from "./Text.js";

export class ChoiceParser {
  public constructor(
    private readonly choiceStart: RegExp,
    private readonly questionStart: RegExp,
  ) {}

  public parse(lines: readonly string[]): Choice[] {
    const choices: Choice[] = [];
    for (const line of lines) {
      const match = line.match(this.choiceStart);
      if (match) {
        choices.push({ solution: normalize(match[2] ?? "") });
      } else if (choices.length > 0 && line && !this.questionStart.test(line)) {
        const current = choices[choices.length - 1];
        choices[choices.length - 1] = { solution: normalize(`${current.solution} ${line}`) };
      }
    }
    return choices;
  }

  public firstChoiceIndex(lines: readonly string[]): number {
    return lines.findIndex((line) => this.choiceStart.test(line));
  }
}
