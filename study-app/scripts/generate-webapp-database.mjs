import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { createQuestionDatabase } from "./question-database.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const databasePath = resolve(root, "webapp/data/database.json");
const outputPath = resolve(root, "webapp/src/generated/questionDatabase.ts");

const source = JSON.parse(await readFile(databasePath, "utf8"));
const refreshed = createQuestionDatabase(source);
const database = `${JSON.stringify(refreshed, null, 2)}\n`;
await writeFile(databasePath, database, "utf8");
const compressed = gzipSync(database, { level: 9 }).toString("base64");

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `export const questionDatabaseGzipBase64 = ${JSON.stringify(compressed)};\n`, "utf8");
console.log(`Refreshed database hash and embedded ${Object.values(refreshed.domains).flat().length} questions.`);
