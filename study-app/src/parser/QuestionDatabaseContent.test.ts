import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { QuestionDatabase } from "../model";

const dataDirectory = resolve(__dirname, "../../webapp/data");
const database = JSON.parse(readFileSync(resolve(dataDirectory, "problems.json"), "utf8")) as QuestionDatabase;
const questions = Object.values(database.domains).flat();
const overrides = JSON.parse(readFileSync(resolve(dataDirectory, "override.json"), "utf8")) as Record<string, { choices?: { explanation?: string }[] }>;

describe("published question content", () => {
  it("provides an explanation for every incorrect choice", () => {
    const missing = questions.flatMap(question => question.choices.flatMap((choice, index) =>
      !choice.correct && !choice.explanation?.trim() ? [`Question ${question.questionNumber}, choice ${index + 1}`] : []));

    expect(questions.length).toBeGreaterThan(0);
    expect(missing).toEqual([]);
  });

  it("stores every incorrect-choice explanation in its matching override", () => {
    const mismatches = questions.flatMap(question => question.choices.flatMap((choice, index) => {
      if (choice.correct) return [];
      const explanation = overrides[String(question.questionNumber)]?.choices?.[index]?.explanation;
      return !explanation?.trim() || explanation !== choice.explanation
        ? [`Question ${question.questionNumber}, choice ${index + 1}`] : [];
    }));

    expect(mismatches).toEqual([]);
  });

  it("keeps override records physically ordered by question number", () => {
    const text = readFileSync(resolve(dataDirectory, "override.json"), "utf8");
    const keys = [...text.matchAll(/^ {2}"(\d+)":/gm)].map(match => Number(match[1]));

    expect(keys.length).toBeGreaterThan(0);
    expect(keys).toEqual([...keys].sort((a, b) => a - b));
    expect(new Set(keys).size).toBe(keys.length);
  });
});
