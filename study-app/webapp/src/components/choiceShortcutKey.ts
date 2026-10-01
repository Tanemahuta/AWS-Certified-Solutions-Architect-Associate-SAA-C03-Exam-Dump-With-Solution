export function choiceShortcutKey(index: number): string | undefined {
  if (index >= 0 && index < 9) return String(index + 1);
  if (index === 9) return "0";
  return undefined;
}
