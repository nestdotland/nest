import { parse } from "../../deps.ts";
import {
  handleError,
  log,
  setupLogLevel,
  writeLogFile,
} from "../utilities/log.ts";
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
  arguments: [{
    name: "[command]",
    description: "A command to run, help by default.",
  }],
  subCommands: mainCommands,
  action,
};

export async function action() {
  const {
    _: [command],
    "log-level": logLevel,
    version,
    help,
    gui,
    log: logFile,
  } = parse(
    Deno.args,
    { alias: aliasesFromOptions(mainOptions) },
  );

  setupLogLevel();

  let logToFile: string | undefined;

  try {
    const flags = assertFlags(
      { command, logLevel, version, help, gui, logFile },
    );

    logToFile = typeof flags.logFile === "string" ? flags.logFile : undefined;

    await main(
      flags.command,
      flags.logLevel,
      flags.version,
      flags.help,
    );

    if (flags.logFile) {
      await writeLogFile(logToFile);
    }

    Deno.exit(0);
  } catch (err) {
    if (err instanceof NestCLIError) {
      log.debug(err.stack);
      Deno.exit(1);
    }

    await handleError(err, logToFile);
    Deno.exit(2);
  }
}

interface rawFlags {
  command: string | number | undefined;
  logLevel: unknown;
  logFile: unknown;
  version: unknown;
  help: unknown;
  gui: unknown;
}

interface Flags {
  command: string | undefined;
  logLevel: string | undefined;
  logFile: string | boolean | undefined;
  version: boolean | undefined;
  help: boolean | undefined;
  gui: boolean | undefined;
}

function assertFlags(
  { command, logLevel, version, help, gui, logFile }: rawFlags,
): Flags {
  if (command !== undefined && typeof command !== "string") {
    log.error(`Command should be of type string. Received ${command}`);
    throw new NestCLIError("Invalid type (command)");
  }
  if (logLevel !== undefined && typeof logLevel !== "string") {
    log.error(`Log level should be of type string. Received ${logLevel}`);
    throw new NestCLIError("Invalid type (logLevel)");
  }
  if (
    logFile !== undefined && typeof logFile !== "string" &&
    typeof logFile !== "boolean"
  ) {
    log.error(`Log should be of type string or boolean. Received ${logFile}`);
    throw new NestCLIError("Invalid type (logToFile)");
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
  return { command, logLevel, version, help, gui, logFile };
}
