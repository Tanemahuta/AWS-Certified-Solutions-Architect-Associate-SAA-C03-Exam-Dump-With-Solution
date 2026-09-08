/**
 * Installs a fresh, isolated in-memory `localStorage`. Works in both Jest's `node` environment (which has
 * no `localStorage`) and `jsdom` (whose built-in `localStorage` is a getter that ignores plain assignment).
 */
export function installMockLocalStorage(): Storage {
  const data = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key: string) => data.get(key) ?? null,
    key: (index: number) => [...data.keys()][index] ?? null,
    removeItem: (key: string) => void data.delete(key),
    setItem: (key: string, value: string) => void data.set(key, value),
  };
  Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true, writable: true });
  return storage;
}
