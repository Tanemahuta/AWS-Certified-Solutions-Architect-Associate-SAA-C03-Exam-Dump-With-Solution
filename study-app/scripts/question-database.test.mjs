import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { createQuestionDatabase } from "./question-database.mjs";

const database = JSON.parse(readFileSync(new URL("../webapp/data/database.json", import.meta.url), "utf8"));
const questions = Object.values(database.domains).flat();

test("refreshes stale hashes deterministically without changing source content", () => {
  const source = { hash: "stale", domains: { Security: [{ questionNumber: 1, question: "Original", choices: [{ solution: "A", correct: false }] }] } };
  const original = structuredClone(source);
  const refreshed = createQuestionDatabase(source);
  assert.equal(refreshed.hash, createHash("sha512").update(JSON.stringify(source.domains)).digest("hex"));
  assert.deepEqual(refreshed.domains, source.domains);
  assert.deepEqual(refreshed, createQuestionDatabase({ ...source, hash: "" }));
  assert.deepEqual(source, original);
  const changed = structuredClone(source);
  changed.domains.Security[0].question = "Changed";
  assert.notEqual(refreshed.hash, createQuestionDatabase(changed).hash);
});

test("rejects malformed domain groups and duplicate or invalid question identities", () => {
  assert.throws(() => createQuestionDatabase({}), /domain groups/);
  assert.throws(() => createQuestionDatabase({ domains: { Security: {} } }), /array/);
  assert.throws(() => createQuestionDatabase({ domains: { Security: [{ questionNumber: 0 }] } }), /Invalid/);
  assert.throws(() => createQuestionDatabase({ domains: { Security: [{ questionNumber: 1 }], Resilience: [{ questionNumber: 1 }] } }), /Duplicate/);
});

test("embedded data exactly matches the database and its recalculated hash", () => {
  assert.deepEqual(database, createQuestionDatabase(database));
  const module = readFileSync(new URL("../webapp/src/generated/questionDatabase.ts", import.meta.url), "utf8");
  const encoded = JSON.parse(module.match(/= (".*");/)[1]);
  assert.deepEqual(JSON.parse(gunzipSync(Buffer.from(encoded, "base64")).toString()), database);
});

test("all questions 1–684 have readable text and explanations for every option", () => {
  assert.deepEqual(questions.map(q => q.questionNumber).sort((a, b) => a - b), Array.from({ length: 684 }, (_, i) => i + 1));
  for (const question of questions) {
    assert.match(question.question, /<p>/);
    assert.ok(question.choices.some(choice => choice.correct), `No correct answer in question ${question.questionNumber}`);
    for (const choice of question.choices) {
      assert.ok(choice.solution.trim(), `Empty option in question ${question.questionNumber}`);
      assert.ok(choice.explanation?.trim(), `Missing explanation in question ${question.questionNumber}`);
    }
  }
});

test("code blocks declare supported languages and JSON code is valid", () => {
  let count = 0;
  for (const question of questions) {
    const fields = [question.question, ...question.choices.flatMap(choice => [choice.solution, choice.explanation ?? ""])];
    for (const text of fields) {
      for (const match of text.matchAll(/<code([^>]*)>([\s\S]*?)<\/code>/gi)) {
        count++;
        const language = /^ class="language-(json|yaml|javascript|bash|sql|plaintext)"$/.exec(match[1]);
        assert.ok(language, `Missing or unsupported language in question ${question.questionNumber}`);
        if (language[1] === "json") assert.doesNotThrow(() => JSON.parse(match[2]));
      }
    }
  }
  assert.ok(count > 0);
});
