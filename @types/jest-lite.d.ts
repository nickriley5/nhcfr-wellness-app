declare const jest: {
  fn: (...args: unknown[]) => unknown;
  mock: (...args: unknown[]) => void;
};

declare function describe(name: string, fn: () => void): void;
declare function beforeEach(fn: () => void | Promise<void>): void;
declare function it(name: string, fn: () => void | Promise<void>): void;
declare function expect(value: unknown): {
  toBe: (expected: unknown) => void;
  toEqual: (expected: unknown) => void;
  toThrow: (expected?: unknown) => void;
};
