import { choiceShortcutKey } from "../choiceShortcutKey";

describe("choiceShortcutKey", () => {
  it("provides shortcuts dynamically for all answer choices shown in AWS-style questions", () => {
    expect(Array.from({ length: 5 }, (_value, index) => choiceShortcutKey(index))).toEqual(["1", "2", "3", "4", "5"]);
  });

  it("uses 0 as the tenth shortcut and leaves further choices without a shortcut", () => {
    expect(choiceShortcutKey(9)).toBe("0");
    expect(choiceShortcutKey(10)).toBeUndefined();
  });
});
