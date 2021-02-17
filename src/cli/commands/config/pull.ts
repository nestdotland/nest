import { parse, yellow } from "../../deps.ts";
import {
  aliasesFromOptions,
  CommandMap,
  limitArgs,
  limitOptions,
} from "../../utils/cli.ts";
import { log } from "../../utils/log.ts";
import { setupCheckType } from "../../processing/check_type.ts";
import { NestCLIError } from "../../utils/error.ts";
import { downloadConfig } from "../../../mod/api/_todo.ts";
import * as diff from "../../processing/diff.ts";
import * as jsonDiff from "../../processing/json_diff.ts";
import * as config from "../../config/config.ts";

import { configCommand } from "./config.ts";

import type { Args, Command, Json, Meta, Project } from "../../utils/types.ts";

interface Flags {
  force?: boolean;
}

export const pullCommand: Command = {
  name: "pull",
  description: "Fetch from and integrate with remote config",
  arguments: [],
  options: [
    ...configCommand.options,
    {
      flag: "-f, --force",
      description: "Overwrite local config",
    },
  ],
  subCommands: new CommandMap(),
  action,
};

export async function action(args = Deno.args) {
  const { force } = assertFlags(
    parse(args, { alias: aliasesFromOptions(pullCommand.options) }),
  );

  await pull(force);
}

function assertFlags(args: Args): Flags {
  const { _: remainingArgs, force, ...remainingOptions } = args;

  limitOptions(remainingOptions, pullCommand.options);
  limitArgs(remainingArgs);

  const { checkType, typeError } = setupCheckType("flags");

  checkType("--force", force, ["boolean"]);

  if (typeError()) throw new NestCLIError("Flags: Invalid type");

  return { force } as Flags;
}

// **************** logic ****************

/** Returns true if a conflict was detected. */
export async function pull(
  force?: boolean,
  localConfig?: { project: Project; meta: Meta; ignore: string },
  remoteConfig?: {
    meta: Meta;
    ignore: string;
    lastSync: number;
  },
): Promise<boolean | undefined> {
  await config.local.ensureExists();
  const { project, meta, ignore } = localConfig ?? await config.local.get();
  const remote = remoteConfig ?? await downloadConfig(project);

  if (force) {
    log.warning(`using ${yellow("--force")}.`);
    await config.local.update(project, remote.meta, remote.ignore);
    log.info("Config was force pulled to local.");
    return;
  }

  // Get file diff
  const metaDiff = jsonDiff.compare(meta as Json, project.meta as Json);
  const ignoreDiff = diff.compare(ignore, project.ignore);

  const metaChanged = jsonDiff.isModified(metaDiff);
  const ignoreChanged = diff.isModified(ignoreDiff);

  if (!metaChanged && !ignoreChanged) {
    const remoteMetaDiff = jsonDiff.compare(meta as Json, remote.meta as Json);
    const remoteIgnoreDiff = diff.compare(ignore, remote.ignore);
    if (
      jsonDiff.isModified(remoteMetaDiff) && diff.isModified(remoteIgnoreDiff)
    ) {
      log.info("Already synced !");
    }

    await config.local.update(project, remote.meta, remote.ignore);
  } else {
    // Apply file diff
    const [newMeta, metaConflict] = jsonDiff.apply(
      metaDiff,
      remote.meta as Json,
    ) as [Meta, boolean];
    const [newIgnore, ignoreConflict] = diff.apply(ignoreDiff, remote.ignore);

    const newMetaDiff = jsonDiff.compare(newMeta as Json, meta as Json);
    const newIgnoreDiff = diff.compare(newIgnore, ignore);

    if (metaConflict) {
      jsonDiff.print(config.meta.FILE, newMetaDiff);
    }

    if (ignoreConflict) {
      diff.print(config.ignore.FILE, newIgnoreDiff);
    }

    await config.local.update(project, newMeta, newIgnore);
    log.info("Successfully updated config !");

    if (metaConflict || ignoreConflict) {
      log.warning(
        "Conflict detected. Please resolve this conflict before pushing to remote.",
      );
    }
    return true;
  }
}
