import type { Problem } from "../model.js";
import type { QuestionOverrides } from "./QuestionOverride.js";

/**
 * Applies hand-authored answer/explanation corrections to parsed problems, keyed by question
 * number. Used as a post-processing step after parsing, since some questions are ambiguous enough
 * that the automated answer matcher picks the wrong choice.
 */
export class QuestionOverrideApplier {
  public constructor(private readonly overrides: QuestionOverrides) {}

  public apply(problem: Problem): Problem {
    const override = this.overrides[String(problem.questionNumber)];
    if (!override) return problem;
    return deepMerge(problem, override) as Problem;
  }
}

function deepMerge(base: unknown, override: unknown): unknown {
  if (Array.isArray(base) && Array.isArray(override)) {
    const merged = [...base];
    override.forEach((value, index) => {
      merged[index] = deepMerge(base[index], value);
    });
    return merged;
  }
  if (!isRecord(base) || !isRecord(override)) return override;

  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    merged[key] = key in base ? deepMerge(base[key], value) : value;
  }
  return merged;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
