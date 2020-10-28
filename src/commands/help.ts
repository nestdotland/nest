import { parse } from "../../deps.ts";
import { log } from "../utilities/log.ts";
import { limitArgs, limitOptions } from "../utilities/cli.ts";
import { globalOptions } from "./global/options.ts";
import type { Command } from "../utilities/types.ts";
import { CLIError } from "../error.ts";

import { help } from "../help.ts";

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
  options: globalOptions,
  subCommands: {},
  action,
};

async function action() {
  const { _: [_, command, ...remainingArgs], ...remainingOptions } = parse(
    Deno.args,
  );

  limitOptions(remainingOptions, globalOptions);
  limitArgs(remainingArgs);

  const flags = assertFlags({ command });

  help(flags.command);
}

function assertFlags({ command }: rawFlags): Flags {
  if (command !== undefined && typeof command !== "string") {
    log.error(`Command should be of type string. Received ${command}`);
    throw new CLIError("Invalid type (version)");
  }
  return { command };
}
