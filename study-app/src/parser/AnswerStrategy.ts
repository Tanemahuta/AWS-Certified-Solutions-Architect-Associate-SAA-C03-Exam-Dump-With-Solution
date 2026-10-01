import { normalize } from "./Text.js";

export interface ParsedAnswer {
  readonly answer: string;
  readonly explanation: string;
  readonly answerLetters: readonly string[];
}

export interface AnswerContext {
  readonly lines: readonly string[];
  readonly answerLineIndex: number;
  readonly answerLine?: string;
  readonly answerLetters: readonly string[];
}

export interface AnswerStrategy {
  extract(context: AnswerContext): readonly string[];
}

export class DeclaredAnswerStrategy implements AnswerStrategy {
  public extract({ lines }: AnswerContext): readonly string[] {
    return lines.flatMap((line) => {
      const match = line.match(/^\s*Answers?:\s*(.+)$/i);
      return match?.[1].match(/[A-H](?=\s*\)|\s*[.)]|\b)/gi)?.map((letter) => letter.toUpperCase()) ?? [];
    });
  }
}

export class ExplicitCombinationStrategy implements AnswerStrategy {
  public extract({ lines }: AnswerContext): readonly string[] {
    return lines.flatMap((line) => {
      const match = line.match(/^\s*([A-H](?:\s*(?:,|and|&)\s*[A-H])+)\s*$/i);
      return match?.[1].match(/[A-H]/gi)?.map((letter) => letter.toUpperCase()) ?? [];
    });
  }
}

export class AnnotatedChoiceStrategy implements AnswerStrategy {
  public extract({ lines }: AnswerContext): readonly string[] {
    return lines.flatMap((line) => {
      const match = line.match(/^\s*([A-H])[.)]\s+(.+)$/i);
      if (!match || /\b(no|not|incorrect|wrong|ruling out)\b/i.test(match[2])) return [];
      return [match[1].toUpperCase()];
    });
  }
}

export class MatchedAnswerLineStrategy implements AnswerStrategy {
  public extract({ answerLetters }: AnswerContext): readonly string[] {
    return answerLetters;
  }
}

export class AnswerStrategyPipeline {
  public constructor(private readonly strategies: readonly AnswerStrategy[]) {}

  public parse(context: AnswerContext): ParsedAnswer {
    const answerLetters = [...new Set(this.strategies.flatMap((strategy) => strategy.extract(context)))];
    const answer = context.answerLine ? normalize(context.answerLine) : "";
    const explanation = context.lines.slice(context.answerLineIndex + 1).filter((line) => line && !/^[-]+$/.test(line)).join(" ");
    return { answer, explanation: normalize(explanation), answerLetters };
  }
}
