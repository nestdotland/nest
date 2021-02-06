import { exists as exists_, join } from "../../deps.ts";
import { readJson, writeJson } from "../../utils/json.ts";
import { PATH as DIR_PATH } from "./nest.ts";
import { assertMeta } from "../parse/meta.ts";
import type { Json, Meta } from "../../utils/types.ts";

export const FILE = "module.json";
export const PATH = join(DIR_PATH, FILE);

/** Test whether or not the meta file exists by checking with the file system */
export function exists(): Promise<boolean> {
  return exists_(PATH);
}

/** Reads the meta file. */
export function read(): Promise<string> {
  return Deno.readTextFile(PATH);
}

/** Reads and parses the meta file. */
export async function parse(path = PATH): Promise<Meta> {
  const json = await readJson(path) as Json;

  return assertMeta(json, FILE);
}

/** Writes a meta object to the meta file. */
export async function write(
  content: Meta,
  path = PATH,
): Promise<void> {
  await writeJson(path, {
    $schema: "../cli/module.json",
    ...content,
  }, { spaces: 2 });
}
