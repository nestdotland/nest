import { exists, join } from "../../deps.ts";
import { readJson, writeJson } from "../../utilities/json.ts";
import { NEST_DIRECTORY } from "./nest.ts";
import { assertMeta } from "../../config/meta.ts";
import type { MetaData, Json } from "../../utilities/types.ts";

export const MODULE_FILE = "module.json";
export const MODULE_PATH = join(NEST_DIRECTORY, MODULE_FILE);

export function moduleJsonExists(): Promise<boolean> {
  return exists(MODULE_PATH);
}

/** Reads and parses the `module.json` file. */
export async function readModuleJson(path = MODULE_PATH): Promise<MetaData> {
  const json = await readJson(path) as Json;

  return assertMeta(json, MODULE_FILE);
}

export async function writeModuleJson(
  object: MetaData,
  path = MODULE_PATH,
): Promise<void> {
  await writeJson(path, object, { spaces: 2 });
}
