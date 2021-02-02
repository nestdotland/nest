import { exists as exists_, join } from "../../deps.ts";
import { readJson, writeJson } from "../../utilities/json.ts";
import { PATH as DIR_PATH } from "./nest.ts";
import { assertProject } from "../parse/project.ts";
import type { Json, Project } from "../../utilities/types.ts";

export const FILE = "data.json";
export const PATH = join(DIR_PATH, FILE);

export function exists() {
  return exists_(PATH);
}

/** Reads the `data.json` file. */
export function read(): Promise<string> {
  return Deno.readTextFile(PATH);
}

/** Reads and parses the `data.json` file. */
export async function parse(path = PATH): Promise<Project> {
  const json = await readJson(path) as Json;

  return assertProject(json, FILE);
}

export async function write(content: Project, path = PATH) {
  await writeJson(path, {
    $comment: "THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.",
    ...content,
  }, { spaces: 2 });
}
