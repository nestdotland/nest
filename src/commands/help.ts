import { parse } from "../../deps.ts";
import { log } from "../utilities/log.ts";
import { limitArgs, limitOptions } from "../utilities/cli.ts";
import { mainCommand, mainOptions } from "../main.ts";
import type { Command } from "../utilities/types.ts";
import { NestCLIError } from "../error.ts";

import { help } from "../actions/help.ts";

interface rawFlags {
  command?: string | number;
}

interface Flags {
  command?: string;
}

export const helpCommand: Command = {
  name: "help",
  description: "Show this help or the help of a sub-command",
  arguments: ["[command]"],
  options: mainOptions,
  subCommands: {},
  action,
};

mainCommand.subCommands[helpCommand.name] = helpCommand;

async function action() {
  const { _: [_, command, ...remainingArgs], ...remainingOptions } = parse(
    Deno.args,
  );

  limitOptions(remainingOptions, mainOptions);
  limitArgs(remainingArgs);

  const flags = assertFlags({ command });

  help(mainCommand, flags.command);
}

function assertFlags({ command }: rawFlags): Flags {
  if (command !== undefined && typeof command !== "string") {
    log.error(`Command should be of type string. Received ${command}`);
    throw new NestCLIError("Invalid type (version)");
  }
  return { command };
}
