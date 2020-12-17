import { exists, join } from "../../deps.ts";
import { readJson, writeJson } from "../../utilities/json.ts";
import { NEST_DIRECTORY } from "./nest.ts";
import type { Module } from "../../utilities/types.ts";
import { assertModule } from "../../config/module.ts";

export const DATA_FILE = "data.json";
export const DATA_PATH = join(NEST_DIRECTORY, DATA_FILE);

type RawJson = Record<string, unknown>;

export function dataJsonExists() {
  return exists(DATA_PATH);
}

export async function readDataJson(path = DATA_PATH): Promise<Module> {
  const json = await readJson(path) as RawJson;

  return assertModule(json, DATA_FILE);
}

export async function writeDataJson(object: unknown, path = DATA_PATH) {
  await writeJson(path, object, { spaces: 2 });
}
