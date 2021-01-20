import { exists, join } from "../../deps.ts";
import { readJson, writeJson } from "../../utilities/json.ts";
import { NEST_DIRECTORY } from "./nest.ts";
import { assertProject } from "../../config/project.ts";
import type { Project, Json } from "../../utilities/types.ts";

export const DATA_FILE = "data.json";
export const DATA_PATH = join(NEST_DIRECTORY, DATA_FILE);

export function dataJsonExists() {
  return exists(DATA_PATH);
}

/** Reads and parses the `data.json` file. */
export async function readDataJson(path = DATA_PATH): Promise<Project> {
  const json = await readJson(path) as Json;

  return assertProject(json, DATA_FILE);
}

export async function writeDataJson(object: Project, path = DATA_PATH) {
  await writeJson(path, object, { spaces: 2 });
}
