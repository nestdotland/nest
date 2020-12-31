import { exists, join } from "../../deps.ts";
import { readJson, writeJson } from "../../utilities/json.ts";
import { NEST_DIRECTORY } from "./nest.ts";
import type { Meta } from "../../utilities/types.ts";
import { assertMeta } from "../../config/meta.ts";

export const MODULE_FILE = "module.json";
export const MODULE_PATH = join(NEST_DIRECTORY, MODULE_FILE);

type RawJson = Record<string, unknown>;

export function moduleJsonExists() {
  return exists(MODULE_PATH);
}

export async function readModuleJson(path = MODULE_PATH): Promise<Meta> {
  const json = await readJson(path) as RawJson;

  return assertMeta(json, MODULE_FILE);
}

export async function writeModuleJson(object: unknown, path = MODULE_PATH) {
  await writeJson(path, object, { spaces: 2 });
}
