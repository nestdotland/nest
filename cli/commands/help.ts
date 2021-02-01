import { parse } from "../deps.ts";
import { NestCLIError } from "../error.ts";
import { limitOptions, setupCheckType } from "../utilities/cli.ts";
import { mainOptions } from "./main/options.ts";
import { mainCommand } from "../commands/main.ts";
import { help } from "../functions/help.ts";

import type { Args, Command } from "../utilities/types.ts";

export const helpCommand: Command = {
  name: "help",
  description: "Show this help or the help of a sub-command",
  arguments: [{
    name: "[...command]",
    description: "A command",
  }],
  options: mainOptions,
  subCommands: {},
  action,
};

export function action() {
  const { commands } = assertFlags(parse(Deno.args));

  help(mainCommand, commands);
}

interface Flags {
  commands?: string[];
}

function assertFlags(args: Args): Flags {
  const { _: [_, ...commands], ...remainingOptions } = args;

  limitOptions(remainingOptions, mainOptions);

  const { checkType, typeError } = setupCheckType("flags");

  for (let i = 0; i < commands.length; i++) {
    checkType("[command]", commands[i], ["string"]);
  }

  if (typeError()) throw new NestCLIError("Flags: Invalid type");

  return { commands } as Flags;
}
