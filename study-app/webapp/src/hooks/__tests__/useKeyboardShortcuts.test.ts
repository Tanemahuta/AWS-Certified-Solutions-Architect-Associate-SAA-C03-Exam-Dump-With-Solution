import { matchesKeyboardShortcut } from "../useKeyboardShortcuts";
import type { KeyboardShortcut } from "../useKeyboardShortcuts";

function event(key: string, overrides: Partial<Pick<KeyboardEvent, "ctrlKey" | "metaKey" | "altKey" | "shiftKey">> = {}): Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "altKey" | "shiftKey"> {
  return {
    key,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    ...overrides,
  };
}

describe("matchesKeyboardShortcut", () => {
  const shortcut: KeyboardShortcut = { key: "2", action: jest.fn() };

  it("matches a plain shortcut key", () => {
    expect(matchesKeyboardShortcut(shortcut, event("2"))).toBe(true);
  });

  it("matches shortcut keys case-insensitively", () => {
    expect(matchesKeyboardShortcut({ key: "n", action: jest.fn() }, event("N"))).toBe(true);
  });

  it("does not match disabled shortcuts", () => {
    expect(matchesKeyboardShortcut({ ...shortcut, enabled: false }, event("2"))).toBe(false);
  });

  it.each([
    ["ctrl", { ctrlKey: true }],
    ["command/meta", { metaKey: true }],
    ["alt", { altKey: true }],
    ["shift", { shiftKey: true }],
  ] as const)("does not match when %s is pressed with the shortcut key", (_label, modifier) => {
    expect(matchesKeyboardShortcut(shortcut, event("2", modifier))).toBe(false);
  });

  it("does not match a different key", () => {
    expect(matchesKeyboardShortcut(shortcut, event("3"))).toBe(false);
  });
});
