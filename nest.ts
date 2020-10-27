import { parse } from "./deps.ts";
import { handleError, log, setupLogLevel } from "./src/utilities/log.ts";
import { globalOptions } from "./src/global/options.ts";
import { aliasesFromFlags } from "./src/utilities/cli.ts";
import { getHelp } from "./src/help.ts";
import { CLIError } from "./src/global/error.ts";
import type { Command } from "./src/utilities/types.ts";

import { upgradeCommand } from "./src/commands/upgrade.ts";

interface rawFlags {
  command?: string | number;
  logLevel?: any;
  help?: any;
}

interface Flags {
  command?: string;
  logLevel?: string;
  help?: boolean;
}

const nestCommand: Command = {
  name: "",
  description:
    "nest.land - A module registry and CDN for Deno, on the permaweb",
  options: globalOptions,
  arguments: ["[command]"],
  subCommands: {
    "upgrade": upgradeCommand,
  },
  action: async () => {
    getHelp(nestCommand);
  },
};

await action();

async function action() {
  const { _: [command], logLevel, help } = parse(
    Deno.args,
    { alias: aliasesFromFlags(nestCommand.options) },
  );

  setupLogLevel();

  try {
    const flags = assertFlags({ command, logLevel, help });

    await nest(flags);

    Deno.exit(0);
  } catch (err) {
    if (err instanceof CLIError) {
      log.debug(err.message, err.stack);
      Deno.exit(1);
    }

    await handleError(err);
    Deno.exit(2);
  }
}

async function nest({ command, logLevel, help }: Flags) {
  if (help) {
    if (command && command in nestCommand.subCommands) {
      getHelp(nestCommand.subCommands[command]);
    } else {
      getHelp(nestCommand);
    }
    return;
  }

  setupLogLevel(logLevel);

  if (command) {
    if (command in nestCommand.subCommands) {
      await nestCommand.subCommands[command].action();
    } else {
      log.error(`Unknown command: ${command}`);
      throw new CLIError("Unknown command");
    }
  } else {
    await nestCommand.action();
  }
}

function assertFlags({ command, logLevel, help }: rawFlags): Flags {
  if (command !== undefined && typeof command !== "string") {
    log.error(`Command should be of type string. Received ${command}`);
    throw new CLIError("Invalid type (command)");
  }
  if (logLevel !== undefined && typeof logLevel !== "string") {
    log.error(`Log level should be of type string. Received ${logLevel}`);
    throw new CLIError("Invalid type (logLevel)");
  }
  if (help !== undefined && typeof help !== "boolean") {
    log.error(`Help should be of type boolean. Received ${help}`);
    throw new CLIError("Invalid type (help)");
  }
  return { command, logLevel, help };
}
