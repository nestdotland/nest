import { parse } from "../deps.ts";
import { limitArgs, limitOptions } from "../utilities/cli.ts";
import { mainOptions } from "./main/options.ts";
import { getHooks } from "../config/hooks.ts";
import { sync } from "../functions/sync.ts";

import type { Args, Command } from "../utilities/types.ts";

export const syncCommand: Command = {
  name: "sync",
  description: "Synchronize remote and local configuration.",
  arguments: [],
  options: mainOptions,
  subCommands: {},
  action,
};

export async function action(args = Deno.args) {
  assertFlags(parse(args));

  const hooks = await getHooks();

  await hooks.sync(sync());
}

function assertFlags(args: Args): void {
  const { _: [_, ...remainingArgs], ...remainingOptions } = args;

  limitOptions(remainingOptions, mainOptions);
  limitArgs(remainingArgs);

  return;
}
