import { parse } from "../deps.ts";
import { limitArgs, limitOptions } from "../utilities/cli.ts";
import { mainOptions } from "./main/options.ts";
import { init } from "../functions/init.ts";

import type { Command, Args } from "../utilities/types.ts";

export const initCommand: Command = {
  name: "init",
  description: "Initiates a new module for the nest.land registry",
  arguments: [],
  options: mainOptions,
  subCommands: {},
  action,
};

export async function action(args = Deno.args) {
  assertFlags(parse(args));

  await init();
}

function assertFlags(args: Args): void {
  const { _: [_, ...remainingArgs], ...remainingOptions } = args;

  limitOptions(remainingOptions, mainOptions);
  limitArgs(remainingArgs);

  return;
}
