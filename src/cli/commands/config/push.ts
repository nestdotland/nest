import { parse } from "../../deps.ts";
import {
  aliasesFromOptions,
  limitArgs,
  limitOptions,
} from "../../utils/cli.ts";
import { log } from "../../utils/log.ts";
import { setupCheckType } from "../../processing/check_type.ts";
import { NestCLIError } from "../../utils/error.ts";
import { downloadConfig, uploadConfig } from "../../../mod/api/_todo.ts";
import * as config from "../../config/config.ts";

import { configCommand } from "./config.ts";

import type { Args, Command, Meta, Project } from "../../utils/types.ts";

interface Flags {
  force?: boolean;
}

export const pushCommand: Command = {
  name: "push",
  description: "Update remote config",
  arguments: [],
  options: [
    ...configCommand.options,
    {
      flag: "-f, --force",
      description: "Overwrite remote config",
    },
  ],
  subCommands: new Map(),
  action,
};

configCommand.subCommands.set(pushCommand.name, pushCommand);

export async function action(args = Deno.args) {
  const { force } = assertFlags(
    parse(args, { alias: aliasesFromOptions(pushCommand.options) }),
  );

  await push(force);
}

function assertFlags(args: Args): Flags {
  const { _: remainingArgs, force, ...remainingOptions } = args;

  limitOptions(remainingOptions, pushCommand.options);
  limitArgs(remainingArgs);

  const { checkType, typeError } = setupCheckType("flags");

  checkType("--force", force, ["boolean"]);

  if (typeError()) throw new NestCLIError("Flags: Invalid type");

  return { force } as Flags;
}

// **************** logic ****************

export async function push(
  force?: boolean,
  localConfig?: { project: Project; meta: Meta; ignore: string },
  remoteConfig?: {
    meta: Meta;
    ignore: string;
    lastSync: number;
  },
) {
  await config.local.ensureExists();
  const user = await config.users.getActive();
  const { project, meta, ignore } = localConfig ?? await config.local.get();
  // TODO(oganexon): if remote config doesn't exist just force push
  const remote = remoteConfig ?? await downloadConfig(project);

  if (force || project.lastSync > remote.lastSync) {
    await uploadConfig(project, meta, ignore, user.token);
    await config.local.update(project, meta, ignore);
    if (force) log.warning("Config was force pushed to remote.");
    return;
  }

  log.error(
    "Remote config was modified. Please pull the changes before pushing the new config.",
  );
  throw new NestCLIError("Remote ahead of local config. (push)");
}
