export interface Choice {
  readonly solution: string;
  readonly correct?: boolean;
  readonly explanation?: string;
}

export interface Problem {
  readonly questionNumber: number;
  readonly question: string;
  readonly choices: readonly Choice[];
}

export interface QuestionDatabase {
  readonly hash: string;
  readonly domains: Record<string, Problem[]>;
}
