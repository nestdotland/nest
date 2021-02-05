import { parse } from "../deps.ts";
import { limitArgs, limitOptions } from "../utilities/cli.ts";
import { getHooks } from "../config/hooks.ts";
import { mainCommand, mainOptions } from "./main.ts";
import { sync } from "../functions/sync.ts";

import type { Args, Command } from "../utilities/types.ts";

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
  const { _: [_, ...remainingArgs], ...remainingOptions } = args;

  limitOptions(remainingOptions, mainOptions);
  limitArgs(remainingArgs);

  return;
}
