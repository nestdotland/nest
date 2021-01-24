import { log } from "../utilities/log.ts";
import { parseDataJson, writeDataJson } from "../config/data.json.ts";
import { readIgnore, writeIgnore } from "../config/ignore.ts";
import { ensureConfig } from "../config/all.ts";
import { parseModuleJson, writeModuleJson } from "../config/module.json.ts";
import {
  applyJsonDiff,
  compareJson,
  Diff,
  isJsonUnchanged,
  printJsonDiff,
} from "../processing/json.ts";
import { confirm } from "../utilities/interact.ts";
import { downloadConfig, uploadConfig } from "../../lib/api/_todo.ts";
import { getActiveUser } from "./login.ts";
import type { Json, Meta, Module, Project } from "../utilities/types.ts";

export async function sync(module?: Module) {
  const user = await getActiveUser();

  if (module !== undefined) {
    const { meta, ignore } = await downloadConfig(module);
    const project = {
      meta,
      api: {
        versions: [],
        lastPublished: 0,
        latestVersion: "",
      },
      ...module,
      version: "0.0.0",
      lastSync: 0,
      nextAutoSync: 0,
    };
    await updateFiles(meta, project, ignore);
  }

  await ensureConfig();

  const project = await parseDataJson();
  const meta = await parseModuleJson();
  const pendingConfig = downloadConfig(project);

  /** 1 - compare the config in module.json (user editable) and data.json. */
  const diff = compareMeta(meta, project.meta);

  if (isJsonUnchanged(diff)) {
    log.info("Local config has not changed, downloading remote config...");
    /** 2.A.1 - if they are same just download the remote config */
    const remote = await pendingConfig;

    const remoteDiff = compareMeta(meta, remote.meta);
    if (isJsonUnchanged(remoteDiff)) {
      log.info("Already synced !");
      return;
    }

    /** 2.A.2 - update the new properties */
    await updateFiles(remote.meta, project, remote.ignore);
  } else {
    log.info("Local config has changed, downloading remote config...");
    /** 2.B.1 - download the remote config */
    const remote = await pendingConfig;

    const newMeta = applyMetaDiff(diff, remote.meta);
    const newDiff = compareMeta(newMeta, meta);
    const newIgnore = ""; // TODO

    printJsonDiff(newDiff);

    const confirmation = await confirm("Accept incoming changes ?");

    if (!confirmation) {
      log.info("Synchronization canceled.");
      return;
    } /** 2.B.2 - update the new properties */

    await updateFiles(newMeta, project, newIgnore);

    /** 2.B.3 - upload the final result to the api */
    await uploadConfig(project, newMeta, newIgnore, user.token);
  }
}

export async function isConfigUpToDate(): Promise<boolean> {
  const meta = await parseModuleJson();
  const project = await parseDataJson();
  const remote = await downloadConfig(project);

  const diff = compareMeta(meta, remote.meta);
  return isJsonUnchanged(diff);
}

async function updateFiles(
  meta: Meta,
  project: Project,
  ignore: string,
): Promise<void> {
  await writeModuleJson(meta);
  project.meta = meta;
  project.lastSync = new Date().getTime();
  await writeDataJson(project);
  await writeIgnore(ignore);
  log.info("Successfully updated config !");
}

function compareMeta(actual: Meta, base: Meta): Diff {
  return compareJson(actual as unknown as Json, base as unknown as Json);
}

function applyMetaDiff(diff: Diff, target: Meta): Meta {
  return applyJsonDiff(diff, target as unknown as Json) as unknown as Meta;
}
