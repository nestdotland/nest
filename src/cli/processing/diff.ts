import { bold, gray, green, red } from "../deps.ts";
import { lineBreak, log } from "../utils/log.ts";
import type { JSONArray, JSONValue } from "../utils/types.ts";

export enum DiffType {
  common = "common",
  added = "added",
  removed = "removed",
  updated = "updated",
}

export type DiffResult<T> = {
  type: DiffType.common | DiffType.added | DiffType.removed;
  value: T;
} | {
  type: DiffType.updated;
  value: T;
  oldValue: T;
};

export type StringDiff = DiffResult<string>[];

/** Compares two string arrays and returns a diff */
export function compare(actual: string, base: string): StringDiff {
  return compare_(actual.split(/\r?\n/), base.split(/\r?\n/));
}

/** Apply a diff to a string */
export function apply(diff: StringDiff, target: string): [string, boolean] {
  let conflict = false;
  /** Apply a diff to an array of string */
  function apply_(diff: StringDiff, target: string[]): string[] {
    let j = 0;
    const res: string[] = [];
    for (let i = 0; i < diff.length; i++, j++) {
      const current = diff[i];
      if (current.type === DiffType.common && target[j]) {
        res.push(target[j]);
      } else if (current.type === DiffType.updated) {
        if (target[j]) res.push(target[j]);
        // in case of conflict
        if (
          !equal(current.oldValue, target[j]) &&
          !equal(current.value, target[j])
        ) {
          res.push(current.value);
          conflict = true;
        }
      } else if (current.type === DiffType.added) {
        res.push(current.value);
        j--;
      } else if (current.type === DiffType.removed) j--;
    }
    for (; j < target.length; j++) {
      res.push(target[j]);
    }
    return res;
  }
  return [apply_(diff, target.split(/\r?\n/)).join("\n"), conflict];
}

/** Compares two string arrays and returns a diff */
export function compare_(actual: string[], base: string[]): StringDiff {
  const diff: StringDiff = [];
  const LCS = longestCommonSubsequence(actual, base);
  let actualIndex = 0;
  let baseIndex = 0;
  for (let i = 0; i <= LCS.length; i++) {
    while (!equal(LCS[i], base[baseIndex]) && baseIndex < base.length) {
      if (
        !equal(LCS[i], actual[actualIndex]) && actualIndex < actual.length
      ) {
        diff.push({
          type: DiffType.updated,
          value: actual[actualIndex],
          oldValue: base[baseIndex],
        });
        actualIndex++;
      } else {
        diff.push({
          type: DiffType.removed,
          value: base[baseIndex],
        });
      }
      baseIndex++;
    }
    while (
      !equal(LCS[i], actual[actualIndex]) && actualIndex < actual.length
    ) {
      diff.push({
        type: DiffType.added,
        value: actual[actualIndex],
      });
      actualIndex++;
    }
    if (LCS[i] !== undefined) {
      diff.push({
        type: DiffType.common,
        value: LCS[i],
      });
    }
    baseIndex++;
    actualIndex++;
  }
  return diff;
}

/** Checks if diff contains added, removed, or updated fields */
export function isModified(diff: StringDiff): boolean {
  for (let i = 0; i < diff.length; i++) {
    if (diff[i].type !== DiffType.common) return true;
  }
  return false;
}

export function print(title: string, diff: StringDiff) {
  log.plain(
    `\n   ${bold(gray(`[${title}]`))} ${bold(red("Deleted"))} / ${
      bold(green("Added"))
    }\n`,
  );

  for (let i = 0; i < diff.length; i++) {
    const current = diff[i];
    if (current.type === DiffType.updated) {
      printLine({ type: DiffType.removed, value: current.oldValue });
      printLine({ type: DiffType.added, value: current.value });
    } else {
      printLine(current);
    }
  }

  lineBreak();
}

function printLine(diff: DiffResult<string>) {
  let line: string;
  switch (diff.type) {
    case DiffType.added:
      line = bold(green(` + ${diff.value}`));
      break;
    case DiffType.removed:
      line = bold(red(` - ${diff.value}`));
      break;
    default:
      line = `   ${diff.value}`;
      break;
  }
  log.plain(line);
}

export function equal(a: JSONValue, b: JSONValue): boolean {
  if (Object.is(a, b)) {
    return true;
  }
  if (typeof a === "object" && typeof b === "object") {
    if (Object.keys(a || {}).length !== Object.keys(b || {}).length) {
      return false;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      for (const key in [...a, ...b]) {
        if (!equal(a && a[key], b && b[key])) {
          return false;
        }
      }
      return true;
    } else if (!Array.isArray(a) && !Array.isArray(b)) {
      for (const key in { ...a, ...b }) {
        if (!equal(a && a[key], b && b[key])) {
          return false;
        }
      }
      return true;
    }
  }
  return false;
}

export function longestCommonSubsequence(c: string[], d: string[]): string[];
export function longestCommonSubsequence(c: JSONArray, d: JSONArray): JSONArray;
export function longestCommonSubsequence(
  c: JSONArray,
  d: JSONArray,
): JSONArray {
  // common final sequence
  c.push("");
  d.push("");

  const matrix = Array.from(
    new Array(c.length + 1),
    () => new Array(d.length + 1),
  );

  function backtrack(
    c: JSONArray,
    d: JSONArray,
    x: number,
    y: number,
  ): JSONArray {
    if (x === 0 || y === 0) return [];
    return equal(c[x - 1], d[y - 1])
      ? backtrack(c, d, x - 1, y - 1).concat(c[x - 1]) // x-1, y-1
      : (matrix[x][y - 1] > matrix[x - 1][y]
        ? backtrack(c, d, x, y - 1)
        : backtrack(c, d, x - 1, y));
  }

  for (let i = 0; i < c.length; i++) {
    matrix[i][0] = 0;
  }
  for (let j = 0; j < d.length; j++) {
    matrix[0][j] = 0;
  }
  for (let i = 1; i <= c.length; i++) {
    for (let j = 1; j <= d.length; j++) {
      matrix[i][j] = c[i - 1] === d[j - 1]
        ? matrix[i - 1][j - 1] + 1 // i-1, j-1
        : Math.max(matrix[i][j - 1], matrix[i - 1][j]);
    }
  }

  const result = backtrack(c, d, c.length, d.length);
  // remove final sequence
  c.pop();
  d.pop();
  result.pop();
  return result;
}
