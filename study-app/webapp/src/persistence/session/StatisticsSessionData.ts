import { z } from "zod";
import { SessionSchema } from "./SessionData";

export const AnswerStatSchema = z.object({
  encountered: z.number(),
  failures: z.number(),
  /**
   * Timestamp (ms since epoch) of the most recent incorrect answer, if any.
   */
  lastFailureAt: z.number().optional(),
});

/**
 * Persisted answer statistics, independent of any particular quiz session.
 */
export const StatisticsSessionSchema = SessionSchema.extend({
  statistics: z.record(z.string(), AnswerStatSchema),
});

export type StatisticsSessionDataShape = z.infer<typeof StatisticsSessionSchema>;

export interface StatisticsSessionData extends StatisticsSessionDataShape {}
