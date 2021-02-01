import { parse } from "../deps.ts";
import {
  handleError,
  log,
  setupLogLevel,
  writeLogFile,
} from "../utilities/log.ts";
import { NestCLIError, NestError } from "../error.ts";
import { aliasesFromOptions, setupCheckType } from "../utilities/cli.ts";
import { mainOptions } from "./main/options.ts";
import { mainCommands } from "./main/commands.ts";
import { main } from "../functions/main.ts";

import type { Args, Command } from "../utilities/types.ts";

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

export async function action(args = Deno.args) {
  setupLogLevel();

  let logToFile: string | undefined;

  try {
    const flags = assertFlags(parse(
      args,
      { alias: aliasesFromOptions(mainOptions) },
    ));

    logToFile = flags.logFile;

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
    if (err instanceof NestCLIError || err instanceof NestError) {
      log.debug(err.stack);
      Deno.exit(1);
    }

    await handleError(err instanceof Error ? err : new Error(err), logToFile);
    Deno.exit(2);
  }
}

interface Flags {
  command?: string;
  logLevel?: string;
  logFile?: string;
  version?: boolean;
  help: unknown;
  gui?: boolean;
}

function assertFlags(args: Args): Flags {
  const {
    _: [command],
    "log-level": logLevel,
    version,
    help,
    gui,
    log: logFile,
  } = args;

  const { checkType, typeError } = setupCheckType("flags");

  checkType("[command]", command, ["string"]);
  checkType("--log-level", logLevel, ["string"]);
  checkType("--log", logFile, ["string"]);
  checkType("--version", version, ["boolean"]);
  checkType("--gui", gui, ["boolean"]);

  if (typeError()) throw new NestCLIError("Flags: Invalid type");

  return { command, logLevel, version, help, gui, logFile } as Flags;
}
