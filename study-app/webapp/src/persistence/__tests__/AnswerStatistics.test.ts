import { installMockLocalStorage } from "../../test-support/mockLocalStorage";
import { AnswerPriority, AnswerStatistics } from "../AnswerStatistics";
import { SessionStore } from "../session/SessionStore";

describe("AnswerStatistics.priority", () => {
  beforeEach(() => installMockLocalStorage());

  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

  function statistics(): AnswerStatistics {
    return new AnswerStatistics(new SessionStore("hash"));
  }

  it("ranks a never-encountered question as NeverCorrect", () => {
    expect(statistics().priority(1)).toBe(AnswerPriority.NeverCorrect);
  });

  it("ranks a question that has only ever failed as NeverCorrect", () => {
    const stats = statistics();
    stats.record(1, false);
    stats.record(1, false);
    expect(stats.priority(1)).toBe(AnswerPriority.NeverCorrect);
  });

  it("ranks a question failed within the last 3 days as RecentFailure", () => {
    const stats = statistics();
    stats.record(1, true);
    stats.record(1, false);
    const now = (stats.get(1)?.lastFailureAt ?? 0) + THREE_DAYS_MS - 1;
    expect(stats.priority(1, now)).toBe(AnswerPriority.RecentFailure);
  });

  it("ranks a question failed more than 3 days ago as StaleFailure", () => {
    const stats = statistics();
    stats.record(1, true);
    stats.record(1, false);
    const now = (stats.get(1)?.lastFailureAt ?? 0) + THREE_DAYS_MS + 1;
    expect(stats.priority(1, now)).toBe(AnswerPriority.StaleFailure);
  });

  it("ranks a question that has only ever been answered correctly as Correct", () => {
    const stats = statistics();
    stats.record(1, true);
    stats.record(1, true);
    expect(stats.priority(1)).toBe(AnswerPriority.Correct);
  });

  it("matches the priority snapshot across the full lifecycle of a question", () => {
    const stats = statistics();
    const timeline: AnswerPriority[] = [];
    timeline.push(stats.priority(1)); // never encountered
    stats.record(1, false);
    timeline.push(stats.priority(1)); // only failed so far
    stats.record(1, true);
    timeline.push(stats.priority(1)); // now has a correct answer too, but recent failure still outranks it
    const lastFailureAt = stats.get(1)?.lastFailureAt ?? 0;
    timeline.push(stats.priority(1, lastFailureAt + THREE_DAYS_MS + 1)); // failure goes stale
    expect(timeline).toMatchSnapshot();
  });
});

describe("AnswerStatistics.replaceAll", () => {
  beforeEach(() => installMockLocalStorage());

  function statistics(): AnswerStatistics {
    return new AnswerStatistics(new SessionStore("hash"));
  }

  it("replaces existing statistics with the imported data", () => {
    const stats = statistics();
    stats.record(1, false);

    stats.replaceAll({ 2: { encountered: 5, failures: 1, lastFailureAt: 1_000 } });

    expect(stats.get(1)).toBeUndefined();
    expect(stats.get(2)).toEqual({ encountered: 5, failures: 1, lastFailureAt: 1_000 });
  });

  it("persists the imported data so it survives reload", () => {
    const store = new SessionStore("hash");
    const stats = new AnswerStatistics(store);
    stats.replaceAll({ 3: { encountered: 2, failures: 0 } });

    expect(new AnswerStatistics(store).get(3)).toEqual({ encountered: 2, failures: 0 });
  });

  it("rejects data that does not match the expected shape, leaving existing statistics untouched", () => {
    const stats = statistics();
    stats.record(1, false);

    expect(() => stats.replaceAll({ 1: { encountered: "not a number" } })).toThrow();
    expect(stats.get(1)).toEqual({ encountered: 1, failures: 1, lastFailureAt: expect.any(Number) });
  });
});
