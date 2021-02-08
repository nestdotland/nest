import { parse } from "../../deps.ts";
import {
  aliasesFromOptions,
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
  remote?: boolean;
}

export const diffCommand: Command = {
  name: "diff",
  description: "Show changes in local config",
  arguments: [],
  options: [
    ...configCommand.options,
    {
      flag: "-r, --remote",
      description: "Compare with remote config",
    },
  ],
  subCommands: new Map(),
  action,
};

configCommand.subCommands.set(diffCommand.name, diffCommand);

export async function action(args = Deno.args) {
  const { remote } = assertFlags(
    parse(args, { alias: aliasesFromOptions(diffCommand.options) }),
  );

  await showDiff(remote);
}

function assertFlags(args: Args): Flags {
  const { _: remainingArgs, remote, ...remainingOptions } = args;

  limitOptions(remainingOptions, diffCommand.options);
  limitArgs(remainingArgs);

  const { checkType, typeError } = setupCheckType("flags");

  checkType("--remote", remote, ["boolean"]);

  if (typeError()) throw new NestCLIError("Flags: Invalid type");

  return { remote } as Flags;
}

// **************** logic ****************

export async function showDiff(
  showRemote?: boolean,
  localConfig?: { project: Project; meta: Meta; ignore: string },
  remoteConfig?: {
    meta: Meta;
    ignore: string;
    lastSync: number;
  },
) {
  await config.local.ensureExists();
  const { project, meta, ignore } = localConfig ?? await config.local.get();

  const metaDiff = jsonDiff.compare(meta as Json, project.meta as Json);
  const ignoreDiff = diff.compare(ignore, project.ignore);

  if (showRemote) {
    const remote = remoteConfig ?? await downloadConfig(project);

    const [newMeta] = jsonDiff.apply(
      metaDiff,
      remote.meta as Json,
    ) as [Meta, boolean];
    const [newIgnore] = diff.apply(ignoreDiff, remote.ignore);

    const newMetaDiff = jsonDiff.compare(newMeta as Json, meta as Json);
    const newIgnoreDiff = diff.compare(newIgnore, ignore);

    jsonDiff.print(config.meta.FILE, newMetaDiff);
    diff.print(config.ignore.FILE, newIgnoreDiff);
  } else {
    jsonDiff.print(config.meta.FILE, metaDiff);
    diff.print(config.ignore.FILE, ignoreDiff);
  }
}
