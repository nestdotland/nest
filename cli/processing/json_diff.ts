import { bold, gray, green, red, yellow } from "../deps.ts";
import { lineBreak, log } from "../utilities/log.ts";
import { DiffType, equal, longestCommonSubsequence } from "./diff.ts";
import type { DiffResult } from "./diff.ts";
import type { Json, JSONArray, JSONValue } from "../utilities/types.ts";

export type JSONDiff =
  | DiffResult<JSONValue>
  | JSONDiff[]
  | Map<string, JSONDiff>;

/** Compares two objects and returns a diff */
export function compareJson(actual: Json, base: Json): JSONDiff {
  return compare(actual, base);
}

/** Apply a diff to an object */
export function applyJsonDiff(diff: JSONDiff, target: Json): Json {
  return applyDiff(diff, target) as Json;
}

/** Checks if diff contains added, removed, or updated fields */
export function isJsonUnchanged(diff: JSONDiff): boolean {
  if (Array.isArray(diff)) {
    for (let i = 0; i < diff.length; i++) {
      if (!isJsonUnchanged(diff[i])) return false;
    }
    return true;
  } else if (diff instanceof Map) {
    for (const [_, value] of diff) {
      if (!isJsonUnchanged(value)) return false;
    }
    return true;
  }
  return diff.type === DiffType.common;
}

function compare(actual?: JSONValue, base?: JSONValue): JSONDiff {
  if (actual === undefined) {
    return {
      type: DiffType.removed,
      value: base as JSONValue,
    };
  }
  if (base === undefined) {
    return {
      type: DiffType.added,
      value: actual,
    };
  }
  if (Array.isArray(actual)) {
    if (!Array.isArray(base)) {
      return {
        type: DiffType.updated,
        value: actual,
        oldValue: base,
      };
    }
    const diff: JSONDiff[] = [];
    const LCS = longestCommonSubsequence(actual, base);
    let actualIndex = 0;
    let baseIndex = 0;
    for (let i = 0; i <= LCS.length; i++) {
      while (!equal(LCS[i], base[baseIndex]) && baseIndex < base.length) {
        if (
          !equal(LCS[i], actual[actualIndex]) && actualIndex < actual.length
        ) {
          diff.push(compare(actual[actualIndex], base[baseIndex]));
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
  } else if (typeof actual === "object" && actual !== null) {
    if (typeof base !== "object" || base === null || Array.isArray(base)) {
      return {
        type: DiffType.updated,
        value: actual,
        oldValue: base,
      };
    }
    const diff: Map<string, JSONDiff> = new Map();
    for (const key in base) {
      const actualValue = actual[key];
      const baseValue = base[key];
      diff.set(key, compare(actualValue, baseValue));
    }
    for (const key in actual) {
      if (diff.get(key) !== undefined) continue;
      const actualValue = actual[key];
      diff.set(key, compare(actualValue, undefined));
    }
    return diff;
  }
  return actual === base
    ? {
      type: DiffType.common,
      value: actual,
    }
    : {
      type: DiffType.updated,
      value: actual,
      oldValue: base,
    };
}

function applyDiff(
  diff: JSONDiff,
  target: JSONValue,
): JSONValue | undefined {
  if (Array.isArray(diff)) {
    if (Array.isArray(target)) {
      let j = 0;
      const res: JSONArray = [];
      for (let i = 0; i < diff.length; i++, j++) {
        const current = diff[i];
        if (Array.isArray(current) || (current instanceof Map)) {
          res.push(applyDiff(current, target[j]) as JSONValue);
        } else {
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
            }
          } else if (current.type === DiffType.added) {
            res.push(current.value);
            j--;
          } else if (current.type === DiffType.removed) j--;
        }
      }
      for (; j < target.length; j++) {
        res.push(target[j]);
      }
      return res;
    }
    return target;
  } else if (diff instanceof Map) {
    if (
      typeof target === "object" && target !== null && !Array.isArray(target)
    ) {
      for (const [key, value] of diff) {
        const result = applyDiff(value, target[key]);
        if (result !== undefined) target[key] = result;
        else delete target[key];
      }
    }
    return target;
  }
  if (diff.type === DiffType.common) return target;
  if (diff.type === DiffType.updated || diff.type === DiffType.added) {
    return diff.value;
  }
  if (diff.type === DiffType.removed) return undefined;
}

export function printJsonDiff(title: string, diff: JSONDiff) {
  log.plain(
    `\n   ${bold(gray(`[${title}]`))} ${bold(red("Deleted"))} / ${
      bold(green("Added"))
    }\n`,
  );

  printDiff(diff, "");

  lineBreak();
}

function printDiff(diff: JSONDiff, indent: string, key?: string) {
  const newIndent = indent + "  ";
  if (diff instanceof Map) {
    log.plain(`${indent}   ${key ? `${key}: ` : ""}{`);
    for (const [key, value] of diff) {
      printDiff(value, newIndent, key);
    }
    log.plain(`${indent}   },`);
  } else if (Array.isArray(diff)) {
    log.plain(`${indent}   ${key ? `${key}: ` : ""}[`);
    for (let i = 0; i < diff.length; i++) {
      printDiff(diff[i], newIndent);
    }
    log.plain(`${indent}   ],`);
  } else {
    if (diff.type === DiffType.updated) {
      print({ type: DiffType.removed, value: diff.oldValue }, indent, key);
      print({ type: DiffType.added, value: diff.value }, indent, key);
    } else {
      print(diff, indent, key);
    }
  }
}

function print(diff: DiffResult<JSONValue>, indent: string, key?: string) {
  const value = `${indent}${key ? `${key}: ` : ""}${
    Deno.inspect(diff.value, { depth: Infinity, compact: false }).replaceAll(
      "\n",
      `\n${indent}`,
    )
  },`;
  let line: string;
  switch (diff.type) {
    case DiffType.added:
      line = bold(green(` + ${value.replaceAll("\n", "\n + ")}`));
      break;
    case DiffType.removed:
      line = bold(red(` - ${value.replaceAll("\n", "\n - ")}`));
      break;
    default:
      line = `   ${value.replaceAll("\n", "\n   ")}`;
      break;
  }
  log.plain(line);
}
