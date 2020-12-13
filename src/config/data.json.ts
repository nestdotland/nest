import { path } from "../../deps.ts";
import { readJson } from "../utilities/json.ts";
import { NEST_DIRECTORY } from "./nest.ts";
import type { Module } from "../utilities/types.ts";
import { assertModule } from "./assert/module.ts";

export const DATA_FILE = "data.json";
export const DATA_PATH = path.join(NEST_DIRECTORY, DATA_FILE);

type RawJson = Record<string, unknown>;

export async function readDataJson(): Promise<Module> {
  const json = await readJson(DATA_PATH) as RawJson;

  return assertModule(json, DATA_FILE);
}