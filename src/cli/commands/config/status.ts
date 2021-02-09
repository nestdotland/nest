import { bold, gray, green, parse, red, yellow } from "../../deps.ts";
import { CommandMap, limitArgs, limitOptions } from "../../utils/cli.ts";
import { lineBreak, log } from "../../utils/log.ts";
import { downloadConfig } from "../../../mod/api/_todo.ts";
import * as diff from "../../processing/diff.ts";
import * as jsonDiff from "../../processing/json_diff.ts";
import * as config from "../../config/config.ts";

import { configCommand } from "./config.ts";

import type { Args, Command, Json, Meta, Project } from "../../utils/types.ts";

export const statusCommand: Command = {
  name: "status",
  description: "Show the current config status",
  arguments: [],
  options: configCommand.options,
  subCommands: new CommandMap(),
  action,
};

export async function action(args = Deno.args) {
  assertFlags(parse(args));

  await status();
}

function assertFlags(args: Args): void {
  const { _: remainingArgs, ...remainingOptions } = args;

  limitOptions(remainingOptions, statusCommand.options);
  limitArgs(remainingArgs);
}

// **************** logic ****************

export async function status(
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

  const remote = remoteConfig ?? await downloadConfig(project);

  const [newMeta] = jsonDiff.apply(
    metaDiff,
    remote.meta as Json,
  ) as [Meta, boolean];
  const [newIgnore] = diff.apply(ignoreDiff, remote.ignore);

  const remoteMetaDiff = jsonDiff.compare(newMeta as Json, meta as Json);
  const remoteIgnoreDiff = diff.compare(newIgnore, ignore);

  const modified = bold(green("modified"));
  const unchanged = bold(yellow("unchanged"));

  log.info("Local diff status:");
  log.plain(
    gray("  -"),
    config.meta.FILE,
    jsonDiff.isModified(metaDiff) ? modified : unchanged,
  );
  log.plain(
    gray("  -"),
    config.ignore.FILE,
    diff.isModified(ignoreDiff) ? modified : unchanged,
  );
  lineBreak();

  log.info("Remote diff status:");
  log.plain(
    gray("  -"),
    config.meta.FILE,
    jsonDiff.isModified(remoteMetaDiff) ? modified : unchanged,
  );
  log.plain(
    gray("  -"),
    config.ignore.FILE,
    diff.isModified(remoteIgnoreDiff) ? modified : unchanged,
  );
  lineBreak();
  log.info(
    "Current config is",
    bold(project.lastSync < remote.lastSync ? red("older") : green("newer")),
    "than remote config",
  );
}
