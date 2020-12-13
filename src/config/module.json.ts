import { path } from "../../deps.ts";
import { readJson } from "../utilities/json.ts";
import { NEST_DIRECTORY } from "./nest.ts";
import type { Meta } from "../utilities/types.ts";
import { assertMeta } from "./assert/meta.ts";

export const MODULE_FILE = "module.json";
export const MODULE_PATH = path.join(NEST_DIRECTORY, MODULE_FILE);

type RawJson = Record<string, unknown>;

export async function readModuleJson(): Promise<Meta> {
  const json = await readJson(MODULE_PATH) as RawJson;

  return assertMeta(json, MODULE_FILE);
}
