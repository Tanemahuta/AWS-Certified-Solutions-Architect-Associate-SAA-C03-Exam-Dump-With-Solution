import type { SessionData } from "./SessionData";

/**
 * Generic per-key storage for {@link SessionData} in `localStorage`.
 *
 * Every stored session is stamped with the question-set hash active at write time. On
 * {@link SessionStore.load}, sessions stamped with a different hash are treated as absent,
 * automatically invalidating sessions made stale by a question database change.
 */
export class SessionStore {
  public constructor(private readonly questionHash: string) {}

  public load<T extends SessionData>(key: string): T | undefined {
    const raw = localStorage.getItem(key);
    if (!raw) return undefined;
    try {
      const session = JSON.parse(raw) as T;
      if (session.questionHash !== this.questionHash) return undefined;
      return session;
    } catch {
      return undefined;
    }
  }

  public store<T extends SessionData>(key: string, session: Omit<T, "questionHash">): void {
    const stamped: SessionData = { ...session, questionHash: this.questionHash };
    localStorage.setItem(key, JSON.stringify(stamped));
  }

  public clear(key: string): void {
    localStorage.removeItem(key);
  }
}
