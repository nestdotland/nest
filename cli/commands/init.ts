import { parse } from "../deps.ts";
import type { Args } from "../deps.ts";
import { limitArgs, limitOptions, setupCheckType } from "../utilities/cli.ts";
import type { Command } from "../utilities/types.ts";

import { mainOptions } from "./main/options.ts";

import { init } from "../functions/init.ts";

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
