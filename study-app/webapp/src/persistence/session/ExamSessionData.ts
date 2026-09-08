import { z } from "zod";
import { SessionSchema } from "./SessionData";

/**
 * A session for an examination.
 */
export const ExamSessionSchema = SessionSchema.extend({
  /**
   * Questions selected for the session.
   */
  selectedQuestions: z.array(z.number()),
  /**
   * Answers provided for each question, keyed by question ID.
   */
  answers: z.record(z.string(), z.array(z.string())),
  /**
   * Order in which choices are displayed, keyed by question ID.
   */
  choiceOrder: z.record(z.string(), z.array(z.string())),
  /**
   * Index of the question currently being answered.
   */
  index: z.number(),
});

export type ExamSessionDataShape = z.infer<typeof ExamSessionSchema>;

export interface ExamSessionData extends ExamSessionDataShape {}
