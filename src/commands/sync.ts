import { parse } from "../deps.ts";
import type { Args } from "../deps.ts";
import { limitArgs, limitOptions, setupCheckType } from "../utilities/cli.ts";
import type { Command } from "../utilities/types.ts";

import { mainOptions } from "./main/options.ts";

import { sync } from "../functions/sync.ts";

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

  await sync();
}

function assertFlags(args: Args): void {
  const { _: [_, ...remainingArgs], ...remainingOptions } = args;

  limitOptions(remainingOptions, mainOptions);
  limitArgs(remainingArgs);

  return;
}
