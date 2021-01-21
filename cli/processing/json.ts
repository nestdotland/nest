import { bold, gray, green, red, yellow } from "../deps.ts";
import { lineBreak, log } from "../utilities/log.ts";
import { NestCLIError } from "../error.ts";
import type { Json, JSONValue } from "../utilities/types.ts";

export enum DiffType {
  common = "common",
  added = "added",
  removed = "removed",
  updated = "updated",
}

export interface DiffResult {
  type: DiffType;
  value: JSONValue;
}

export type Diff = DiffResult | Diff[] | Map<string, Diff>;

/** Compares two objects and returns a diff */
export function compareJson(actual: Json, base: Json): Diff {
  return compare(actual, base);
}

/** Apply a diff to an object */
export function applyJsonDiff(diff: Diff, target: Json): Json {
  return applyDiff(diff, target) as Json;
}

/** Checks if diff contains added, removed, or updated fields */
export function isJsonUnchanged(diff: Diff): boolean {
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

function compare(actual?: JSONValue, base?: JSONValue): Diff {
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
      };
    }
    const diff: Diff[] = [];
    for (let i = 0; i < Math.max(actual.length, base.length); i++) {
      const actualValue = actual[i];
      const baseValue = base[i];
      diff.push(compare(actualValue, baseValue));
    }
    return diff;
  } else if (typeof actual === "object" && actual !== null) {
    if (typeof base !== "object" || base === null || Array.isArray(base)) {
      return {
        type: DiffType.updated,
        value: actual,
      };
    }
    const diff: Map<string, Diff> = new Map();
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
  return {
    type: actual === base ? DiffType.common : DiffType.updated,
    value: actual,
  };
}

function applyDiff(
  diff: Diff,
  target: JSONValue,
): JSONValue | undefined {
  if (Array.isArray(diff)) {
    if (Array.isArray(target)) {
      for (let i = 0; i < diff.length; i++) {
        const result = applyDiff(diff[i], target[i]);
        if (result !== undefined) target[i] = result;
        else {
          target.length = i;
          break;
        }
      }
      return target;
    }
    throw new NestCLIError(
      "Unable to apply JSON diff: target is not an array.",
    );
  } else if (diff instanceof Map) {
    if (
      typeof target === "object" && target !== null && !Array.isArray(target)
    ) {
      for (const [key, value] of diff) {
        const result = applyDiff(value, target[key]);
        if (result !== undefined) target[key] = result;
        else delete target[key];
      }
      return target;
    }
    throw new NestCLIError(
      "Unable to apply JSON diff: target is not an object.",
    );
  }
  if (diff.type === DiffType.common) return target;
  if (diff.type === DiffType.updated || diff.type === DiffType.added) {
    return diff.value;
  }
  if (diff.type === DiffType.removed) return undefined;
}

export function printJsonDiff(diff: Diff) {
  log.plain(
    `\n   ${bold(gray("[Diff]"))} ${bold(red("Deleted"))} / ${
      bold(green("Added"))
    } / ${bold(yellow("Modified"))}\n`,
  );

  printDiff(diff, "");

  lineBreak();
}

function printDiff(diff: Diff, indent: string, key?: string) {
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
      case DiffType.updated:
        line = bold(yellow(` ~ ${value.replaceAll("\n", "\n ~ ")}`));
        break;
      default:
        line = `   ${value.replaceAll("\n", "\n   ")}`;
        break;
    }
    log.plain(line);
  }
}
