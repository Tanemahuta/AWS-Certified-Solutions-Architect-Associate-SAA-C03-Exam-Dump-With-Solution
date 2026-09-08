#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Command } from "commander";
import { ProblemParser } from "./parser.js";
import type { Problem, QuestionDatabase } from "./model.js";

const defaultPdf = "../AWS Certified Solutions Architect Associate SAA-C03.pdf";
const defaultSolutions = "../AWS SAA-03 Solution.txt";
const defaultDatabase = "webapp/data/problems.json";
const defaultOverrides = "webapp/data/override.json";

class CreateDatabaseCommand {
  public constructor(
    private readonly pdfPath: string,
    private readonly solutionPath: string,
    private readonly outputPath: string,
    private readonly overridePath: string,
  ) {}

  public async execute(): Promise<void> {
    const problems = await new ProblemParser(this.pdfPath, this.solutionPath, this.overridePath).parse();
    if (Object.values(problems).flat().length === 0) throw new Error("No questions were extracted from the PDF.");
    const database: QuestionDatabase = {
      hash: createHash("sha512").update(JSON.stringify(problems)).digest("hex"),
      domains: problems,
    };
    await mkdir(resolve(this.outputPath, ".."), { recursive: true });
    const outputPath = resolve(this.outputPath);
    await writeFile(outputPath, `${JSON.stringify(database, null, 2)}\n`, "utf8");
    console.log(`Wrote ${Object.values(problems).flat().length} problems to ${outputPath}`);
  }
}

async function readDatabase(path: string): Promise<Problem[]> {
  const database = JSON.parse(await readFile(path, "utf8")) as QuestionDatabase | Record<string, Problem[]>;
  const grouped = "domains" in database ? database.domains : database;
  return Object.values(grouped).flat().sort((left, right) => left.questionNumber - right.questionNumber);
}

const program = new Command()
  .name("saa-questions")
  .description("Build and query a local SAA-C03 question database")
  .version("1.0.0");

program
  .command("create-db")
  .alias("import")
  .description("Create a JSON database from the PDF and solution text files")
  .option("--pdf <path>", "source PDF", defaultPdf)
  .option("--solutions <path>", "solution text file", defaultSolutions)
  .option("--output <path>", "database output", defaultDatabase)
  .option("--overrides <path>", "question override JSON, applied as a post-processing step", defaultOverrides)
  .action(async ({ pdf, solutions, output, overrides }: { pdf: string; solutions: string; output: string; overrides: string }) => {
    await new CreateDatabaseCommand(resolve(pdf), resolve(solutions), output, resolve(overrides)).execute();
  });

program
  .command("list")
  .description("List questions in the database")
  .option("--database <path>", "database path", defaultDatabase)
  .action(async ({ database }: { database: string }) => {
    const problems = await readDatabase(resolve(database));
    problems.forEach((problem) => console.log(`${problem.questionNumber}. ${problem.question}`));
  });

program
  .command("show <number>")
  .description("Show a question, choices, and matched explanation")
  .option("--database <path>", "database path", defaultDatabase)
  .action(async (number: string, { database }: { database: string }) => {
    const problem = (await readDatabase(resolve(database))).find((candidate) => candidate.questionNumber === Number(number));
    if (!problem) throw new Error(`Question ${number} was not found.`);
    console.log(problem.question);
    problem.choices.forEach((choice, index) => {
      console.log(`${String.fromCharCode(65 + index)}. ${choice.solution}${choice.correct ? " [correct]" : ""}`);
      if (choice.explanation) console.log(`   ${choice.explanation}`);
    });
  });

await program.parseAsync();
