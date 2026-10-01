import { questionDatabaseGzipBase64 } from "../generated/questionDatabase";
import type { Problem } from "../model/Problem";

export interface QuestionDatabase {
  readonly hash: string;
  readonly domains: Record<string, Problem[]>;
}

export async function loadQuestionDatabase(): Promise<QuestionDatabase> {
  if (typeof DecompressionStream === "undefined") throw new Error("This browser does not support gzip-compressed question data.");

  const compressed = Uint8Array.from(atob(questionDatabaseGzipBase64), (character) => character.charCodeAt(0));
  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("gzip"));
  return JSON.parse(await new Response(stream).text()) as QuestionDatabase;
}
