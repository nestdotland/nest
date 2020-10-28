import { parse } from "./deps.ts";
import { handleError, log, setupLogLevel } from "./src/utilities/log.ts";
import { aliasesFromOptions, globalOptions } from "./src/utilities/cli.ts";
import { getHelp } from "./src/help.ts";
import { CLIError } from "./src/error.ts";
import type { Command } from "./src/utilities/types.ts";

import { upgradeCommand } from "./src/commands/upgrade.ts";
import { publishCommand } from "./src/commands/publish.ts";

import { version as currentVersion } from "./src/version.ts";

interface rawFlags {
  command?: string | number;
  logLevel?: unknown;
  version?: unknown;
  help?: unknown;
  gui?: unknown;
}

interface Flags {
  command?: string;
  logLevel?: string;
  version?: boolean;
  help?: boolean;
  gui?: boolean;
}

const nestCommand: Command = {
  name: "",
  description:
    "nest.land - A module registry and CDN for Deno, on the permaweb",
  options: globalOptions,
  arguments: ["[command]"],
  subCommands: {
    [upgradeCommand.name]: upgradeCommand,
    [publishCommand.name]: publishCommand,
  },
  action: async () => {
    getHelp(nestCommand);
  },
};

await action();

async function action() {
  const { _: [command], "log-level": logLevel, version, help, gui } = parse(
    Deno.args,
    { alias: aliasesFromOptions(nestCommand.options) },
  );

  setupLogLevel();

  try {
    const flags = assertFlags({ command, logLevel, version, help, gui });

    await nest(flags);

    Deno.exit(0);
  } catch (err) {
    if (err instanceof CLIError) {
      log.debug(err.stack);
      Deno.exit(1);
    }

    await handleError(err);
    Deno.exit(2);
  }
}

async function nest({ command, logLevel, version, help, gui }: Flags) {
  if (version) {
    console.info(currentVersion);
    return;
  }

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

function assertFlags(
  { command, logLevel, version, help, gui }: rawFlags,
): Flags {
  if (command !== undefined && typeof command !== "string") {
    log.error(`Command should be of type string. Received ${command}`);
    throw new CLIError("Invalid type (command)");
  }
  if (logLevel !== undefined && typeof logLevel !== "string") {
    log.error(`Log level should be of type string. Received ${logLevel}`);
    throw new CLIError("Invalid type (logLevel)");
  }
  if (version !== undefined && typeof version !== "boolean") {
    log.error(`Version should be of type boolean. Received ${version}`);
    throw new CLIError("Invalid type (version)");
  }
  if (help !== undefined && typeof help !== "boolean") {
    log.error(`Help should be of type boolean. Received ${help}`);
    throw new CLIError("Invalid type (help)");
  }
  if (gui !== undefined && typeof gui !== "boolean") {
    log.error(`GUI should be of type boolean. Received ${gui}`);
    throw new CLIError("Invalid type (gui)");
  }
  return { command, logLevel, version, help, gui };
}
