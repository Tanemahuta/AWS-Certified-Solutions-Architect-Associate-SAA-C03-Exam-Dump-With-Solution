import { z } from "zod";
import type { SessionStore } from "./session/SessionStore";
import type { StatisticsSessionData } from "./session/StatisticsSessionData";
import { AnswerStatSchema } from "./session/StatisticsSessionData";

export type AnswerStat = z.infer<typeof AnswerStatSchema>;

export type AnswerStatisticsData = Record<string, AnswerStat>;

export const AnswerStatisticsDataSchema = z.record(z.string(), AnswerStatSchema);

const STATISTICS_KEY = "saa-exam-statistics";

const RECENT_FAILURE_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Relative selection priority for a question, highest first: never answered correctly ranks
 * above a recent (within 3 days) failure, which ranks above an older failure, which ranks above
 * a question that has only ever been answered correctly.
 */
export enum AnswerPriority {
  NeverCorrect = 3,
  RecentFailure = 2,
  StaleFailure = 1,
  Correct = 0,
}

/**
 * Tracks how often each question has been encountered and failed, persisting itself to the
 * given {@link SessionStore} after every change.
 */
export class AnswerStatistics {
  private readonly data: AnswerStatisticsData;

  public constructor(private readonly store: SessionStore) {
    this.data = store.load<StatisticsSessionData>(STATISTICS_KEY)?.statistics ?? {};
  }

  public record(questionIndex: number, correct: boolean): void {
    const stat = this.data[questionIndex] ?? { encountered: 0, failures: 0 };
    stat.encountered += 1;
    if (!correct) {
      stat.failures += 1;
      stat.lastFailureAt = Date.now();
    }
    this.data[questionIndex] = stat;
    this.persist();
  }

  public failureRate(questionIndex: number): number {
    const stat = this.data[questionIndex];
    return stat?.encountered ? stat.failures / stat.encountered : 0;
  }

  /**
   * Selection priority for a question - never-correct and recently-failed questions rank highest
   * so they resurface sooner. Accepts `now` for deterministic testing.
   */
  public priority(questionIndex: number, now: number = Date.now()): AnswerPriority {
    const stat = this.data[questionIndex];
    if (!stat || stat.encountered === stat.failures) return AnswerPriority.NeverCorrect;
    if (stat.failures === 0) return AnswerPriority.Correct;
    if (stat.lastFailureAt !== undefined && now - stat.lastFailureAt <= RECENT_FAILURE_WINDOW_MS) return AnswerPriority.RecentFailure;
    return AnswerPriority.StaleFailure;
  }

  public get(questionIndex: number): AnswerStat | undefined {
    return this.data[questionIndex];
  }

  public get snapshot(): AnswerStatisticsData {
    return structuredClone(this.data);
  }

  public clear(): void {
    Object.keys(this.data).forEach((key) => delete this.data[key]);
    this.persist();
  }

  /**
   * Replaces all statistics with the given data, validating its shape first. Throws if the
   * data does not match {@link AnswerStatisticsDataSchema}, leaving existing statistics untouched.
   */
  public replaceAll(data: unknown): void {
    const parsed = AnswerStatisticsDataSchema.parse(data);
    Object.keys(this.data).forEach((key) => delete this.data[key]);
    Object.assign(this.data, parsed);
    this.persist();
  }

  private persist(): void {
    this.store.store<StatisticsSessionData>(STATISTICS_KEY, { statistics: this.data });
  }
}
