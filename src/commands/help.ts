import { parse } from "../../deps.ts";
import type { Args } from "../../deps.ts";
import { log } from "../utilities/log.ts";
import { NestCLIError } from "../error.ts";
import { limitOptions } from "../utilities/cli.ts";
import type { Command } from "../utilities/types.ts";

import { mainOptions } from "./main/options.ts";
import { mainCommand } from "../commands/main.ts";

import { help } from "../functions/help.ts";

export const helpCommand: Command = {
  name: "help",
  description: "Show this help or the help of a sub-command",
  arguments: [{
    name: "[command]",
    description: "A command",
  }],
  options: mainOptions,
  subCommands: {},
  action,
};

export async function action() {
  const flags = assertFlags(parse(Deno.args));

  help(mainCommand, flags.command);
}

interface Flags {
  command: string | undefined;
}

function assertFlags({ _: [_, command], ...remainingOptions }: Args): Flags {
  limitOptions(remainingOptions, mainOptions);

  if (command !== undefined && typeof command !== "string") {
    log.error(`Command should be of type string. Received ${command}`);
    throw new NestCLIError("Invalid type (version)");
  }
  return { command };
}
