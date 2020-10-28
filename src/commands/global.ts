import { parse } from "../../deps.ts";
import { handleError, log, setupLogLevel } from "../utilities/log.ts";
import { aliasesFromOptions } from "../utilities/cli.ts";
import { CLIError } from "../error.ts";

import { Command } from "../utilities/types.ts";

import { globalOptions } from "./global/options.ts";
import { globalCommands } from "./global/commands.ts";

import { global } from "../global.ts";

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

export const globalCommand: Command = {
  name: "",
  description:
    "nest.land - A module registry and CDN for Deno, on the permaweb",
  options: globalOptions,
  arguments: ["[command]"],
  subCommands: globalCommands,
  action,
};

async function action() {
  const { _: [command], "log-level": logLevel, version, help, gui } = parse(
    Deno.args,
    { alias: aliasesFromOptions(globalCommand.options) },
  );

  setupLogLevel();

  try {
    const flags = assertFlags({ command, logLevel, version, help, gui });

    await global(
      flags.command,
      flags.logLevel,
      flags.version,
      flags.help,
      flags.gui,
    );

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
