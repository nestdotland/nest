import { parse } from "../../deps.ts";
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
  arguments: ["[command]"],
  options: mainOptions,
  subCommands: {},
  action,
};

export async function action() {
  const { _: [_, command], ...remainingOptions } = parse(
    Deno.args,
  );

  limitOptions(remainingOptions, mainOptions);

  const flags = assertFlags({ command });

  help(mainCommand, flags.command);
}

interface rawFlags {
  command?: string | number;
}

interface Flags {
  command?: string;
}

function assertFlags({ command }: rawFlags): Flags {
  if (command !== undefined && typeof command !== "string") {
    log.error(`Command should be of type string. Received ${command}`);
    throw new NestCLIError("Invalid type (version)");
  }
  return { command };
}
