type Enumerable = Record<string | number | symbol, unknown> | unknown[];

export enum DiffType {
  common = "common",
  added = "added",
  removed = "removed",
  updated = "updated",
}

export interface DiffResult {
  type: DiffType;
  value: unknown;
}

export type Diff = DiffResult | Map<string | number | symbol, Diff>;

export function compare(base: unknown, actual: unknown): Diff {
  if (isFunction(base) || isFunction(actual)) {
    throw new Error("Invalid argument. Function given, object expected.");
  }
  if (!isEnumerable(base) || !isEnumerable(actual)) {
    return {
      type: compareValues(base, actual),
      value: base === undefined ? actual : base,
    };
  } else {
    const diff: Map<string, Diff> = new Map();
    for (const key in base) {
      if (isFunction(base[key])) {
        continue;
      }

      let value2 = undefined;
      if (actual[key] !== undefined) {
        value2 = actual[key];
      }

      diff.set(key, compare(base[key], value2));
    }
    for (const key in actual) {
      if (isFunction(actual[key]) || diff.get(key) !== undefined) {
        continue;
      }

      diff.set(key, compare(undefined, actual[key]));
    }

    return diff;
  }
}

export function unchanged(diff: Diff): boolean {
  if (diff instanceof Map) {
    for (const [key, value] of diff) {
      if (!unchanged(value)) return false;
    }
    return true;
  } else {
    return diff.type === DiffType.common;
  }
}

function compareValues(value1: unknown, value2: unknown): DiffType {
  if (value1 === value2) return DiffType.common;
  if (
    isDate(value1) && isDate(value2) &&
    value1.getTime() === value2.getTime()
  ) {
    return DiffType.common;
  }
  if (value1 === undefined) return DiffType.added;
  if (value2 === undefined) return DiffType.removed;
  return DiffType.updated;
}

function isFunction(x: unknown): x is (...args: unknown[]) => unknown {
  return typeof x === "function";
}

function isArray(x: unknown): x is unknown[] {
  return Array.isArray(x);
}

function isDate(x: unknown): x is Date {
  return x instanceof Date;
}

function isObject(x: unknown): boolean {
  return Object.prototype.toString.call(x) === "[object Object]";
}

function isValue(x: unknown): boolean {
  return !isObject(x) && !isArray(x);
}

function isEnumerable(x: unknown): x is Enumerable {
  return !isValue(x);
}

console.log(
  Deno.inspect(
    compare({ 1: [1, 3, 5] }, { 1: { 0: 1, 1: 3, 2: 5 } }),
    { depth: Infinity, colors: true },
  ),
);
