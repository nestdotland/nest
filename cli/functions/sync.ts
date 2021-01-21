import { parseDataJson, writeDataJson } from "../config/files/data.json.ts";
import { ensureConfig } from "../config/files/all.ts";
import { log } from "../utilities/log.ts";
import {
  parseModuleJson,
  writeModuleJson,
} from "../config/files/module.json.ts";
import {
  applyJsonDiff,
  compareJson,
  Diff,
  isJsonUnchanged,
  printJsonDiff,
} from "../processing/json.ts";
import { confirm } from "../utilities/interact.ts";
import { downloadMeta, uploadMeta } from "../../lib/api/_todo.ts";
import type { Json, Meta, Project } from "../utilities/types.ts";

export async function sync(name?: string) {
  await ensureConfig();
  
  const project = await parseDataJson();
  const meta = await parseModuleJson();
  const pendingRemoteMeta = downloadMeta();

  /** 1 - compare the config in module.json (user editable) and data.json. */
  const diff = compareMeta(meta, project.meta);

  if (isJsonUnchanged(diff)) {
    log.info("Local config has not changed, downloading remote config...");
    /** 2.A.1 - if they are same just download the remote config */
    const remoteMeta = await pendingRemoteMeta;

    const remoteDiff = compareMeta(meta, remoteMeta);
    if (isJsonUnchanged(remoteDiff)) {
      log.info("Already synced !");
      return;
    }

    /** 2.A.2 - update the new properties */
    await updateFiles(remoteMeta, project);
  } else {
    log.info("Local config has changed, downloading remote config...");
    /** 2.B.1 - download the remote config */
    const remoteMeta = await pendingRemoteMeta;

    const newMeta = applyMetaDiff(diff, remoteMeta);
    const newDiff = compareMeta(newMeta, meta);

    printJsonDiff(newDiff);

    const confirmation = await confirm("Accept incoming changes ?");

    if (!confirmation) {
      log.info("Synchronization canceled.");
      return;
    } /** 2.B.2 - update the new properties */

    await updateFiles(newMeta, project);

    /** 2.B.3 - upload the final result to the api */
    const token = ""; // TODO
    await uploadMeta(newMeta, token);
  }
}

export async function isConfigUpToDate(): Promise<boolean> {
  const meta = await parseModuleJson();
  const remoteMeta = await downloadMeta();

  const diff = compareMeta(meta, remoteMeta);
  return isJsonUnchanged(diff);
}

async function updateFiles(meta: Meta, project: Project): Promise<void> {
  await writeModuleJson(meta);
  project.meta = meta;
  project.lastSync = new Date().getTime();
  await writeDataJson(project);
  log.info("Successfully updated config !");
}

function compareMeta(actual: Meta, base: Meta): Diff {
  return compareJson(actual as unknown as Json, base as unknown as Json);
}

function applyMetaDiff(diff: Diff, target: Meta): Meta {
  return applyJsonDiff(diff, target as unknown as Json) as unknown as Meta;
}
