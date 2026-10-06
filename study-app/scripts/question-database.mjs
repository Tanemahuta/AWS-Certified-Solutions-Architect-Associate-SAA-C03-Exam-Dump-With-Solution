import { createHash } from "node:crypto";

/** Validate question identities and refresh the content hash without changing questions. */
export function createQuestionDatabase(source) {
  if (!source || typeof source.domains !== "object" || source.domains === null || Array.isArray(source.domains)) {
    throw new Error("Expected a question database with domain groups.");
  }
  const seen = new Set();
  for (const questions of Object.values(source.domains)) {
    if (!Array.isArray(questions)) throw new Error("Each domain must contain an array of questions.");
    for (const question of questions) {
      const number = question.questionNumber;
      if (!Number.isInteger(number) || number < 1) throw new Error(`Invalid question number: ${number}`);
      if (seen.has(number)) throw new Error(`Duplicate question number: ${number}`);
      seen.add(number);
    }
  }
  return {
    // Never reuse a stored hash. Exclude the hash field itself to avoid self-reference.
    hash: createHash("sha512").update(JSON.stringify(source.domains)).digest("hex"),
    domains: source.domains,
  };
}
