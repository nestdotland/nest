import { parse } from "../deps.ts";
import { limitArgs, limitOptions } from "../utils/cli.ts";
import { mainCommand, mainOptions } from "./main.ts";
import { init } from "./functions/init.ts";

import type { Args, Command } from "../utils/types.ts";

export const initCommand: Command = {
  name: "init",
  description: "Initiate a new module for the nest.land registry",
  arguments: [],
  options: mainOptions,
  subCommands: new Map(),
  action,
};

mainCommand.subCommands.set(initCommand.name, initCommand);

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
