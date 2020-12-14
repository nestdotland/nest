import { join } from "../../deps.ts";
import { readJson } from "../../utilities/json.ts";
import { NEST_DIRECTORY } from "./nest.ts";
import type { Module } from "../../utilities/types.ts";
import { assertModule } from "../../config/module.ts";

export const DATA_FILE = "data.json";
export const DATA_PATH = join(NEST_DIRECTORY, DATA_FILE);

type RawJson = Record<string, unknown>;

export async function readDataJson(path = DATA_PATH): Promise<Module> {
  const json = await readJson(path) as RawJson;

  return assertModule(json, DATA_FILE);
}
