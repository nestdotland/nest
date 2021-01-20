import { NestCLIError } from "../error.ts";

type Replacer = (key: string, value: unknown) => unknown;

export interface WriteJsonOptions extends Deno.WriteFileOptions {
  replacer?: Array<number | string> | Replacer;
  spaces?: number | string;
}

export type JSONObject = { [key: string]: JSONValue };
export type JSONArray = JSONValue[];
export type JSONValue =
  | string
  | number
  | JSONObject
  | JSONArray
  | boolean
  | null;
export type Json = JSONArray | JSONObject;

export enum DiffType {
  common = "common",
  added = "added",
  removed = "removed",
  updated = "updated",
}

export interface DiffResult<V extends JSONValue> {
  type: DiffType;
  value: V;
}

export type Diff = DiffResult<JSONValue> | Diff[] | Map<string, Diff>;

function serialize(
  filePath: string,
  object: unknown,
  options: WriteJsonOptions,
): string {
  try {
    const jsonString = JSON.stringify(
      object,
      options.replacer as string[],
      options.spaces,
    );
    return `${jsonString}\n`;
  } catch (err) {
    err.message = `${filePath}: ${err.message}`;
    throw err;
  }
}

/* Writes an object to a JSON file. */
export async function writeJson(
  filePath: string,
  object: unknown,
  options: WriteJsonOptions = {},
): Promise<void> {
  const jsonString = serialize(filePath, object, options);
  await Deno.writeTextFile(filePath, jsonString, {
    append: options.append,
    create: options.create,
    mode: options.mode,
  });
}

/** Reads a JSON file and then parses it into an object */
export async function readJson(filePath: string): Promise<unknown> {
  const decoder = new TextDecoder("utf-8");

  const content = decoder.decode(await Deno.readFile(filePath));

  try {
    return JSON.parse(content);
  } catch (err) {
    err.message = `${filePath}: ${err.message}`;
    throw err;
  }
}

/** Compares two objects and returns a diff */
export function compareJson(actual: Json, base: Json): Diff {
  return compare(actual, base);
}

/** Apply a diff to an object */
export function applyJSONDiff(diff: Diff, target: Json): Json {
  return applyDiff(diff, target) as Json;
}

/** Checks if diff contains added, removed, or updated fields */
export function isJSONUnchanged(diff: Diff): boolean {
  if (Array.isArray(diff)) {
    for (let i = 0; i < diff.length; i++) {
      if (!isJSONUnchanged(diff[i])) return false;
    }
    return true;
  } else if (diff instanceof Map) {
    for (const [_, value] of diff) {
      if (!isJSONUnchanged(value)) return false;
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
