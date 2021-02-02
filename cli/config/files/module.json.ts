import { exists as exists_, join } from "../../deps.ts";
import { readJson, writeJson } from "../../utilities/json.ts";
import { PATH as DIR_PATH } from "./nest.ts";
import { assertMeta } from "../parse/meta.ts";
import type { Json, Meta } from "../../utilities/types.ts";

export const FILE = "module.json";
export const PATH = join(DIR_PATH, FILE);

export function exists(): Promise<boolean> {
  return exists_(PATH);
}

/** Reads the `module.json` file. */
export function read(): Promise<string> {
  return Deno.readTextFile(PATH);
}

/** Reads and parses the `module.json` file. */
export async function parse(path = PATH): Promise<Meta> {
  const json = await readJson(path) as Json;

  return assertMeta(json, FILE);
}

export async function write(
  content: Meta,
  path = PATH,
): Promise<void> {
  await writeJson(path, {
    $schema: "../cli/module.json",
    ...content,
  }, { spaces: 2 });
}
