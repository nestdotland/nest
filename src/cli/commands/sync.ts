import { parse } from "../deps.ts";
import { limitArgs, limitOptions } from "../utils/cli.ts";
import { getHooks } from "../config/hooks.ts";
import { mainCommand, mainOptions } from "./main.ts";
import { log } from "../utils/log.ts";
import { confirm } from "../utils/interact.ts";
import { downloadConfig, uploadConfig } from "../../mod/api/_todo.ts";
import * as config from "../config/config.ts";
import * as diff from "../processing/diff.ts";
import * as jsonDiff from "../processing/json_diff.ts";
import type { Json, Meta, Project } from "../utils/types.ts";

import type { Args, Command } from "../utils/types.ts";

export const syncCommand: Command = {
  name: "sync",
  description: "Synchronize remote and local configuration",
  arguments: [],
  options: mainOptions,
  subCommands: new Map(),
  action,
};

mainCommand.subCommands.set(syncCommand.name, syncCommand);

export async function action(args = Deno.args) {
  assertFlags(parse(args));

  const hooks = await getHooks();

  await hooks.sync(() => sync());
}

function assertFlags(args: Args): void {
  const { _: remainingArgs, ...remainingOptions } = args;

  limitOptions(remainingOptions, mainOptions);
  limitArgs(remainingArgs);

  return;
}

// **************** logic ****************

/** Synchronize remote and local configuration. */
export async function sync() {
  const user = await config.users.getActive();

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
