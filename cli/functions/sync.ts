import { log } from "../utilities/log.ts";
import { confirm } from "../utilities/interact.ts";
import { downloadConfig, uploadConfig } from "../../lib/api/_todo.ts";
import { getActiveUser } from "./login.ts";
import * as config from "../config/config.ts";
import * as diff from "../processing/diff.ts";
import * as jsonDiff from "../processing/json_diff.ts";
import type { Json, Meta, Project } from "../utilities/types.ts";

/** Synchronize remote and local configuration. */
export async function sync() {
  const user = await getActiveUser();

  const project = await config.project.parse();
  const meta = await config.meta.parse();
  const ignore = await config.ignore.read();
  const pendingConfig = downloadConfig(project);

  // 1 - compare the config in the meta file (user editable) and in the project file.
  const metaDiff = jsonDiff.compare(meta as Json, project.meta as Json);

  const metaChanged = jsonDiff.isUnchanged(metaDiff);
  const ignoreChanged = ignore === project.ignore;

  if (!metaChanged && !ignoreChanged) {
    // 2.A.1 - if they are same just download the remote config
    log.info("Local config has not changed, downloading remote config...");
    const remote = await pendingConfig;

    const remoteDiff = jsonDiff.compare(meta as Json, remote.meta as Json);
    if (jsonDiff.isUnchanged(remoteDiff) && ignore === remote.ignore) {
      log.info("Already synced !");
      return;
    }

    // 2.A.2 - update the new properties
    await updateFiles(remote.meta, project, remote.ignore);
  } else {
    // 2.B.1 - download the remote config
    log.info("Local config has changed, downloading remote config...");
    const remote = await pendingConfig;

    const ignore_ = splitLines(ignore);
    const projectIgnore_ = splitLines(project.ignore);
    const remoteIgnore_ = splitLines(remote.ignore);

    const ignoreDiff = diff.compare(ignore_, projectIgnore_);

    // Apply file diff
    const newMeta = jsonDiff.apply(metaDiff, remote.meta as Json) as Meta;
    const newIgnore = diff.apply(ignoreDiff, remoteIgnore_);

    if (metaChanged) {
      const newMetaDiff = jsonDiff.compare(newMeta as Json, meta as Json);
      jsonDiff.print(config.meta.FILE, newMetaDiff);
    }

    if (ignoreChanged) {
      const newIgnoreDiff = diff.compare(newIgnore, ignore_);
      diff.print(config.ignore.FILE, newIgnoreDiff);
    }

    const confirmation = await confirm("Accept incoming changes ?");

    if (!confirmation) {
      log.info("Synchronization canceled.");
      return;
    }
    // 2.B.2 - update the new properties
    const newIgnoreJoined = joinLines(newIgnore);

    await updateFiles(newMeta, project, newIgnoreJoined);

    // 2.B.3 - upload the final result to the api
    await uploadConfig(project, newMeta, newIgnoreJoined, user.token);
  }
}

export async function isConfigUpToDate(): Promise<boolean> {
  const meta = await config.meta.parse();
  const project = await config.project.parse();
  const ignore = await config.ignore.read();
  const remote = await downloadConfig(project);

  const diff = jsonDiff.compare(meta as Json, remote.meta as Json);
  return jsonDiff.isUnchanged(diff) && ignore === remote.ignore;
}

export async function updateFiles(
  meta: Meta,
  project: Project,
  ignore: string,
): Promise<void> {
  project.meta = meta;
  project.lastSync = new Date().getTime();
  await config.meta.write(meta);
  await config.project.write(project);
  await config.ignore.write(ignore);
  log.info("Successfully updated config !");
}

function splitLines(text: string): string[] {
  return text.split(/(\r\n|\n)/);
}

function joinLines(lines: string[]): string {
  return lines.join("\n");
}
