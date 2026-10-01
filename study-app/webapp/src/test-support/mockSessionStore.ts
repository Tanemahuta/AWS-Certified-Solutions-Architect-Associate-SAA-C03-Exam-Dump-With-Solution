/**
 * A jest-mocked {@link SessionStore}-shaped object for unit tests that want to assert on
 * load/store/clear calls without touching real storage. Typed loosely to avoid importing
 * SessionStore's concrete class (which would require a real questionHash + localStorage).
 */
export function mockSessionStore(overrides: Partial<{ load: jest.Mock; store: jest.Mock; clear: jest.Mock }> = {}): {
  load: jest.Mock;
  store: jest.Mock;
  clear: jest.Mock;
} {
  return {
    load: jest.fn().mockReturnValue(undefined),
    store: jest.fn(),
    clear: jest.fn(),
    ...overrides,
  };
}
