import { z } from "zod";

/**
 * A session derived from a set of questions.
 */
export const SessionSchema = z.object({
  /**
   * Hash for the questions used to generate the session, will invalidate a session, if the current question set changes.
   */
  questionHash: z.string(),
});

export type SessionDataShape = z.infer<typeof SessionSchema>;

export interface SessionData extends SessionDataShape {}