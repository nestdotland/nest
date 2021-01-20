import { readDataJson, writeDataJson } from "../config/files/data.json.ts";
import {
  readModuleJson,
  writeModuleJson,
} from "../config/files/module.json.ts";
import {
  applyJSONDiff,
  compareJson,
  isJSONUnchanged,
} from "../utilities/json.ts";
import { downloadMeta, uploadMeta } from "../../lib/api/_todo.ts";
import type { Diff, Json, Meta, Project } from "../utilities/types.ts";

export async function sync(name?: string) {
  const project = await readDataJson();
  const meta = await readModuleJson();
  const remoteMeta = await downloadMeta();

  /** 1 - compare the config in module.json (user editable) and data.json. */
  const diff = compareMeta(meta, project.meta);

  if (isJSONUnchanged(diff)) {
    /** 2 - if they are same just download the remote config */
    await updateFiles(remoteMeta, project);
  } else {
    /** 2.1 - update the new properties */
    const newMeta = applyMetaDiff(diff, remoteMeta);

    await updateFiles(newMeta, project);

    /** 2.2 - upload the final result to the api */
    const token = ""; // TODO
    await uploadMeta(newMeta, token);
  }
}

async function updateFiles(meta: Meta, project: Project) {
  await writeModuleJson(meta);
  project.meta = meta;
  project.lastSync = new Date().getTime();
  await writeDataJson(project);
}

function compareMeta(actual: Meta, base: Meta): Diff {
  return compareJson(actual as unknown as Json, base as unknown as Json);
}

function applyMetaDiff(diff: Diff, target: Meta): Meta {
  return applyJSONDiff(diff, target as unknown as Json) as unknown as Meta;
}
