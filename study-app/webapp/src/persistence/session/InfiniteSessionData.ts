import { z } from "zod";
import { ExamSessionSchema } from "./ExamSessionData";

/**
 * {@link ExamSession} with no time limit. A pass continues through all currently selected
 * questions; after the pass, failed questions become the next pass while prior answers remain
 * stored for history/statistics.
 */
export const InfiniteSessionSchema = ExamSessionSchema.extend({
  /**
   * Questions answered correctly at least once.
   */
  completed: z.array(z.number()),
  /**
   * Questions currently answered incorrectly and awaiting the next retry pass.
   */
  failed: z.array(z.number()),
});

export type InfiniteSessionDataShape = z.infer<typeof InfiniteSessionSchema>;

export interface InfiniteSessionData extends InfiniteSessionDataShape {}
