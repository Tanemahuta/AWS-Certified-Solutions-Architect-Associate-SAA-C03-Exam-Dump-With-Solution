import { z } from "zod";
import { ExamSessionSchema } from "./ExamSessionData";

/**
 * Timed {@link ExamSession}.
 */
export const TimedSessionSchema = ExamSessionSchema.extend({
  /**
   * Time remaining for the session in seconds.
   */
  remainingSeconds: z.number(),
});

export type TimedSessionDataShape = z.infer<typeof TimedSessionSchema>;

export interface TimedSessionData extends TimedSessionDataShape {}
