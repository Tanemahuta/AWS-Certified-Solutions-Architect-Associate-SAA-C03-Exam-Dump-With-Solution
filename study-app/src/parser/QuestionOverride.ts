import type { Problem } from "../model.js";

type DeepPartial<T> = T extends readonly (infer Item)[]
  ? readonly DeepPartial<Item>[]
  : T extends object
    ? { readonly [Key in keyof T]?: DeepPartial<T[Key]> }
    : T;

export type QuestionOverride = DeepPartial<Problem>;
export type QuestionOverrides = Record<string, QuestionOverride>;

/**
 * Type guard-free parse of the raw override JSON file. The file is hand-maintained, so this only
 * does a shallow structural check and trusts the rest.
 */
export function parseQuestionOverrides(raw: string): QuestionOverrides {
  const parsed = JSON.parse(raw) as unknown;
  if (typeof parsed !== "object" || parsed === null) throw new Error("Overrides file must contain a JSON object keyed by question number.");
  return parsed as QuestionOverrides;
}
