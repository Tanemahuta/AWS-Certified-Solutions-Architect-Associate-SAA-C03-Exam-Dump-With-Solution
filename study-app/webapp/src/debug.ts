export const debugEnabled = import.meta.env.VITE_DEBUG === "true";

export function debug(message: string, details?: unknown): void {
  if (debugEnabled) console.debug(`[saa-debug] ${message}`, details ?? "");
}
