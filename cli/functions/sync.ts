import { compare, unchanged } from "../utilities/diff.ts";
import { readDataJson, writeDataJson } from "../config/files/data.json.ts";
import {
  readModuleJson,
  writeModuleJson,
} from "../config/files/module.json.ts";
import type { MetaData } from "../utilities/types.ts";

export async function sync(name?: string) {
  const project = await readDataJson();
  const meta = await readModuleJson();
  const remoteMeta = await downloadConfig();

  /** 1 - compare the config in module.json (user editable) and data.json. */
  const diff = compare(project.meta, meta);

  if (unchanged(diff)) {
    /** 2 - if they are same just download the remote config */
    await writeModuleJson(remoteMeta);
    project.meta = remoteMeta;
    project.lastSync = new Date().getTime();
    await writeDataJson(project);
  } else {
    /** 2.1 - if not same check what properties have changed */
    /** 2.2 - update the new properties */
    /** 2.3 - upload the final result to the api */
  }
}

async function downloadConfig(): Promise<MetaData> {
  // TODO
  return { name: "" };
}
