import { parse } from "../../deps.ts";
import { handleError, log, setupLogLevel } from "../utilities/log.ts";
import { NestCLIError } from "../error.ts";
import { aliasesFromOptions } from "../utilities/cli.ts";
import type { Command } from "../utilities/types.ts";

import { mainOptions } from "./main/options.ts";
import { mainCommands } from "./main/commands.ts";

import { main } from "../functions/main.ts";

export const mainCommand: Command = {
  name: "",
  description:
    "nest.land - A module registry and CDN for Deno, on the permaweb",
  options: mainOptions,
  arguments: ["[command]"],
  subCommands: mainCommands,
  action,
};

export async function action() {
  const { _: [command], "log-level": logLevel, version, help, gui } = parse(
    Deno.args,
    { alias: aliasesFromOptions(mainOptions) },
  );

  setupLogLevel();

  try {
    const flags = assertFlags({ command, logLevel, version, help, gui });

    await main(
      flags.command,
      flags.logLevel,
      flags.version,
      flags.help,
      flags.gui,
    );

    Deno.exit(0);
  } catch (err) {
    if (err instanceof NestCLIError) {
      log.debug(err.stack);
      Deno.exit(1);
    }

    await handleError(err);
    Deno.exit(2);
  }
}

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

function assertFlags(
  { command, logLevel, version, help, gui }: rawFlags,
): Flags {
  if (command !== undefined && typeof command !== "string") {
    log.error(`Command should be of type string. Received ${command}`);
    throw new NestCLIError("Invalid type (command)");
  }
  if (logLevel !== undefined && typeof logLevel !== "string") {
    log.error(`Log level should be of type string. Received ${logLevel}`);
    throw new NestCLIError("Invalid type (logLevel)");
  }
  if (version !== undefined && typeof version !== "boolean") {
    log.error(`Version should be of type boolean. Received ${version}`);
    throw new NestCLIError("Invalid type (version)");
  }
  if (help !== undefined && typeof help !== "boolean") {
    log.error(`Help should be of type boolean. Received ${help}`);
    throw new NestCLIError("Invalid type (help)");
  }
  if (gui !== undefined && typeof gui !== "boolean") {
    log.error(`GUI should be of type boolean. Received ${gui}`);
    throw new NestCLIError("Invalid type (gui)");
  }
  return { command, logLevel, version, help, gui };
}
