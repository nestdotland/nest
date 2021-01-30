import { log } from "../utilities/log.ts";
import { parseDataJson, writeDataJson } from "../config/data.json.ts";
import { IGNORE_FILE, readIgnore, writeIgnore } from "../config/ignore.ts";
import { ensureConfig } from "../config/all.ts";
import {
  MODULE_FILE,
  parseModuleJson,
  writeModuleJson,
} from "../config/module.json.ts";
import {
  applyJsonDiff,
  compareJson,
  isJsonUnchanged,
  JSONDiff,
  printJsonDiff,
} from "../processing/json_diff.ts";
import { ensureNestDir } from "../config/nest.ts";
import { confirm } from "../utilities/interact.ts";
import { downloadConfig, uploadConfig } from "../../lib/api/_todo.ts";
import { getActiveUser } from "./login.ts";
import type { Json, Meta, Module, Project } from "../utilities/types.ts";
import {
  applyStringDiff,
  compareString,
  printStringDiff,
} from "../processing/diff.ts";

export async function sync(module?: Module) {
  const user = await getActiveUser();

  if (module !== undefined) {
    const { meta, ignore } = await downloadConfig(module);
    const project = {
      meta,
      ignore,
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
    await ensureNestDir();
    await updateFiles(meta, project, ignore);
    return;
  }

  await ensureConfig();

  const project = await parseDataJson();
  const meta = await parseModuleJson();
  const ignore = await readIgnore();
  const pendingConfig = downloadConfig(project);

  /** 1 - compare the config in module.json (user editable) and data.json. */
  const metaDiff = compareMeta(meta, project.meta);

  const metaChanged = isJsonUnchanged(metaDiff);
  const ignoreChanged = ignore === project.ignore;

  if (!metaChanged && !ignoreChanged) {
    log.info("Local config has not changed, downloading remote config...");
    /** 2.A.1 - if they are same just download the remote config */
    const remote = await pendingConfig;

    const remoteDiff = compareMeta(meta, remote.meta);
    if (isJsonUnchanged(remoteDiff) && ignore === remote.ignore) {
      log.info("Already synced !");
      return;
    }

    /** 2.A.2 - update the new properties */
    await updateFiles(remote.meta, project, remote.ignore);
  } else {
    log.info("Local config has changed, downloading remote config...");
    /** 2.B.1 - download the remote config */
    const remote = await pendingConfig;

    const ignore_ = splitLines(ignore);
    const projectIgnore_ = splitLines(project.ignore);
    const remoteIgnore_ = splitLines(remote.ignore);

    const ignoreDiff = compareString(ignore_, projectIgnore_);

    // Apply file diff
    const newMeta = applyMetaDiff(metaDiff, remote.meta);
    const newIgnore = applyStringDiff(ignoreDiff, remoteIgnore_);

    if (metaChanged) {
      const newMetaDiff = compareMeta(newMeta, meta);
      printJsonDiff(MODULE_FILE, newMetaDiff);
    }

    if (ignoreChanged) {
      const newIgnoreDiff = compareString(newIgnore, ignore_);
      printStringDiff(IGNORE_FILE, newIgnoreDiff);
    }

    const confirmation = await confirm("Accept incoming changes ?");

    if (!confirmation) {
      log.info("Synchronization canceled.");
      return;
    }
    /** 2.B.2 - update the new properties */
    const newIgnoreJoined = joinLines(newIgnore);

    await updateFiles(newMeta, project, newIgnoreJoined);

    /** 2.B.3 - upload the final result to the api */
    await uploadConfig(project, newMeta, newIgnoreJoined, user.token);
  }
}

export async function isConfigUpToDate(): Promise<boolean> {
  const meta = await parseModuleJson();
  const project = await parseDataJson();
  const ignore = await readIgnore();
  const remote = await downloadConfig(project);

  const diff = compareMeta(meta, remote.meta);
  return isJsonUnchanged(diff) && ignore === remote.ignore;
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

function compareMeta(actual: Meta, base: Meta): JSONDiff {
  return compareJson(actual as unknown as Json, base as unknown as Json);
}

function applyMetaDiff(diff: JSONDiff, target: Meta): Meta {
  return applyJsonDiff(diff, target as unknown as Json) as unknown as Meta;
}

function splitLines(text: string): string[] {
  return text.split(/(\r\n|\n)/);
}

function joinLines(lines: string[]): string {
  return lines.join("\n");
}
