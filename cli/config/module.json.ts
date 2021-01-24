import { exists, join } from "../deps.ts";
import { readJson, writeJson } from "../utilities/json.ts";
import { NEST_DIRECTORY } from "./nest.ts";
import { assertMeta } from "./parse/meta.ts";
import type { Json, Meta } from "../utilities/types.ts";

export const MODULE_FILE = "module.json";
export const MODULE_PATH = join(NEST_DIRECTORY, MODULE_FILE);

export function moduleJsonExists(): Promise<boolean> {
  return exists(MODULE_PATH);
}

/** Reads the `module.json` file. */
export function readModuleJson(): Promise<string> {
  return Deno.readTextFile(MODULE_PATH);
}

/** Reads and parses the `module.json` file. */
export async function parseModuleJson(path = MODULE_PATH): Promise<Meta> {
  const json = await readJson(path) as Json;

  return assertMeta(json, MODULE_FILE);
}

export async function writeModuleJson(
  content: Meta,
  path = MODULE_PATH,
): Promise<void> {
  await writeJson(path, {
    $schema: "../cli/module.json",
    ...content,
  }, { spaces: 2 });
}
