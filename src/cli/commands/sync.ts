import { parse } from "../deps.ts";
import { limitArgs, limitOptions } from "../utils/cli.ts";
import { getHooks } from "../config/hooks.ts";
import { mainCommand, mainOptions } from "./main.ts";
import { downloadConfig } from "../../mod/api/_todo.ts";
import * as config from "../config/config.ts";
import { pull } from "./config/pull.ts";
import { push } from "./config/push.ts";

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
  await config.local.ensureExists();

  const localConfig = await config.local.get();
  // TODO(oganexon): if remote config doesn't exist just force push
  const remoteConfig = await downloadConfig(localConfig.project);

  if (localConfig.project.lastSync < remoteConfig.lastSync) {
    const conflict = await pull(false, localConfig, remoteConfig);
    if (conflict) return;
  }
  await push(false, localConfig, remoteConfig);
}
