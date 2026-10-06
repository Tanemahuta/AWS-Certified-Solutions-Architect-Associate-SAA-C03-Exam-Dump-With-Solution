import { useEffect } from "react";

export interface KeyboardShortcut {
  readonly key: string;
  readonly action: () => void;
  readonly enabled?: boolean;
}

export function matchesKeyboardShortcut(shortcut: KeyboardShortcut, event: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "altKey" | "shiftKey">): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return false;
  return shortcut.enabled !== false && shortcut.key.toLowerCase() === event.key.toLowerCase();
}

export function useKeyboardShortcuts(shortcuts: readonly KeyboardShortcut[]): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      const target = event.target;
      if (target instanceof Element && target.closest("input, select, textarea, [contenteditable=true], .app-menu")) return;
      const shortcut = shortcuts.find((candidate) => matchesKeyboardShortcut(candidate, event));
      if (!shortcut) return;
      event.preventDefault();
      shortcut.action();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}
