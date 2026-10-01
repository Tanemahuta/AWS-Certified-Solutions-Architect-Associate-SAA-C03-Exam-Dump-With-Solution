import type { Choice } from "../../model/Choice";
import { ScoringModel } from "../ScoringModel";

function choice(solution: string, correct?: true): Choice {
  return { solution, correct };
}

describe("ScoringModel", () => {
  const scoring = new ScoringModel();

  describe("isCorrect", () => {
    it("is true when the selected choices exactly match the correct ones", () => {
      const choices = [choice("A", true), choice("B")];
      expect(scoring.isCorrect([choice("A", true)], choices)).toBe(true);
    });

    it("is false when a wrong choice is selected", () => {
      const choices = [choice("A", true), choice("B")];
      expect(scoring.isCorrect([choice("B")], choices)).toBe(false);
    });

    it("is false when nothing is marked correct in the choice list", () => {
      const choices = [choice("A"), choice("B")];
      expect(scoring.isCorrect([choice("A")], choices)).toBe(false);
    });
  });

  describe("percentage / scaledScore / passed", () => {
    it("matches known score snapshots across a range of results", () => {
      const results = [0, 15, 35, 50, 65, 100].map((correct) => ({
        correct,
        percentage: scoring.percentage(correct, 65),
        scaledScore: scoring.scaledScore(correct, 65),
        passed: scoring.passed(correct, 65),
      }));
      expect(results).toMatchSnapshot();
    });

    it("treats zero total questions as 0%, not NaN", () => {
      expect(scoring.percentage(0, 0)).toBe(0);
      expect(scoring.scaledScore(0, 0)).toBe(0);
      expect(scoring.passed(0, 0)).toBe(false);
    });
  });
});
