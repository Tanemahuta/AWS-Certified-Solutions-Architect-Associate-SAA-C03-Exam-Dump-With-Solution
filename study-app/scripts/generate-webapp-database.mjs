import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(root, "webapp/data/problems.json");
const outputPath = resolve(root, "webapp/src/generated/questionDatabase.ts");

const database = await readFile(sourcePath, "utf8");
const compressed = gzipSync(database, { level: 9 }).toString("base64");

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `export const questionDatabaseGzipBase64 = ${JSON.stringify(compressed)};\n`, "utf8");
