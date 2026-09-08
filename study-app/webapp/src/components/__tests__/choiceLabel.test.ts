import { choiceLabel } from "../choiceLabel";

describe("choiceLabel", () => {
  it("formats answer labels from their zero-based choice index", () => {
    expect([0, 1, 2, 3, 4].map(choiceLabel)).toEqual(["A", "B", "C", "D", "E"]);
  });
});
